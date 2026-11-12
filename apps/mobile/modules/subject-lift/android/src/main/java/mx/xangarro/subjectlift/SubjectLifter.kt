package mx.xangarro.subjectlift

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.graphics.Rect
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import expo.modules.kotlin.exception.CodedException
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

data class LiftResult(val uri: String, val lifted: Boolean, val width: Int, val height: Int)

class PhotoUnreadableException(uri: String) :
  CodedException("No se pudo leer la foto en $uri")

/**
 * The lift itself, apart from the module's bridge. ML Kit's foreground
 * bitmap keeps every subject on a transparent background; it is cropped to
 * the box its opaque pixels cover and scaled to at most 1024 px.
 */
class SubjectLifter(private val context: Context) {
  companion object {
    /** The cutout's longest side (ADR-134); the encoder scales it to 512. */
    const val MAX_SIDE = 1024
    /** Photos are decoded down to about this before ML Kit sees them. */
    const val WORKING_SIDE = 2048
    /** Alpha above this counts as subject when finding the crop box. */
    private const val OPAQUE = 8

    /**
     * A new client. Building one starts loading the model in the background
     * (ML Kit's `MobileVisionBase` constructor), so it is made only for a
     * lift and closed after it, never at app start (ADR-143).
     */
    fun segmenter(): SubjectSegmenter =
      SubjectSegmentation.getClient(
        SubjectSegmenterOptions.Builder().enableForegroundBitmap().build()
      )
  }

  /** `segmenter` is null when it cannot work (no Play services, no model yet). */
  fun lift(uri: String, segmenter: SubjectSegmenter?): LiftResult {
    val photo = loadUpright(uri) ?: throw PhotoUnreadableException(uri)
    val cutout = segmenter?.let { foreground(it, photo) }
    return if (cutout != null) {
      write(fitted(cutout), lifted = true)
    } else {
      write(fitted(centredSquare(photo)), lifted = false)
    }
  }

  /** The photo decoded near `WORKING_SIDE`, EXIF rotation applied. */
  private fun loadUpright(uri: String): Bitmap? {
    val parsed = Uri.parse(uri)
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    context.contentResolver.openInputStream(parsed)?.use { BitmapFactory.decodeStream(it, null, bounds) }
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
    var sample = 1
    while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= WORKING_SIDE) sample *= 2
    val opts = BitmapFactory.Options().apply { inSampleSize = sample }
    val bitmap = context.contentResolver.openInputStream(parsed)?.use {
      BitmapFactory.decodeStream(it, null, opts)
    } ?: return null
    val degrees = context.contentResolver.openInputStream(parsed)?.use {
      ExifInterface(it).rotationDegrees
    } ?: 0
    if (degrees == 0) return bitmap
    val m = Matrix().apply { postRotate(degrees.toFloat()) }
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, m, true)
  }

  /** The subject on transparency, cropped to it, or null when there is none. */
  private fun foreground(segmenter: SubjectSegmenter, photo: Bitmap): Bitmap? {
    return try {
      val result = Tasks.await(segmenter.process(InputImage.fromBitmap(photo, 0)))
      val fg = result.foregroundBitmap ?: return null
      val box = opaqueBox(fg) ?: return null
      Bitmap.createBitmap(fg, box.left, box.top, box.width(), box.height())
    } catch (_: Exception) {
      // Model still downloading, or no subject: the square crop goes instead.
      null
    }
  }

  /** The smallest box holding every pixel with alpha above `OPAQUE`. */
  private fun opaqueBox(bitmap: Bitmap): Rect? {
    val w = bitmap.width
    val row = IntArray(w)
    var left = w
    var top = -1
    var right = -1
    var bottom = -1
    for (y in 0 until bitmap.height) {
      bitmap.getPixels(row, 0, w, 0, y, w, 1)
      for (x in 0 until w) {
        if ((row[x] ushr 24) > OPAQUE) {
          if (top < 0) top = y
          bottom = y
          left = min(left, x)
          right = max(right, x)
        }
      }
    }
    if (top < 0) return null
    return Rect(left, top, right + 1, bottom + 1)
  }

  private fun centredSquare(photo: Bitmap): Bitmap {
    val side = min(photo.width, photo.height)
    return Bitmap.createBitmap(photo, (photo.width - side) / 2, (photo.height - side) / 2, side, side)
  }

  private fun fitted(bitmap: Bitmap): Bitmap {
    val longest = max(bitmap.width, bitmap.height)
    if (longest <= MAX_SIDE) return bitmap
    val scale = MAX_SIDE.toFloat() / longest
    return Bitmap.createScaledBitmap(
      bitmap,
      (bitmap.width * scale).roundToInt(),
      (bitmap.height * scale).roundToInt(),
      true
    )
  }

  private fun write(bitmap: Bitmap, lifted: Boolean): LiftResult {
    val file = File(context.cacheDir, "subject-lift-${UUID.randomUUID()}.png")
    FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    return LiftResult(Uri.fromFile(file).toString(), lifted, bitmap.width, bitmap.height)
  }
}
