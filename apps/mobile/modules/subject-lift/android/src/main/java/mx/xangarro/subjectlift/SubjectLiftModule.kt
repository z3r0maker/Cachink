package mx.xangarro.subjectlift

import android.content.Context
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The product photo's lift (M-13, ADR-134), as JavaScript calls it.
 *
 * `lift(uri)` writes a PNG to the cache directory: the subject cropped to its
 * mask (`lifted: true`) or a centred square crop (`lifted: false`) when there
 * is no Play services, no model yet or no subject. It never blocks the photo.
 *
 * Nothing runs at app start (ADR-143). A store install gets the model through
 * the manifest's `DEPENDENCIES` entry; any other install asks for it on the
 * first lift that finds it missing, and that photo goes as a square crop.
 */
class SubjectLiftModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SubjectLift")

    AsyncFunction("lift") { uri: String ->
      val ctx = context
      val segmenter = if (hasPlayServices(ctx)) SubjectLifter.segmenter() else null
      val result = try {
        val ready = segmenter != null && modelReady(ctx, segmenter)
        SubjectLifter(ctx).lift(uri, if (ready) segmenter else null)
      } finally {
        segmenter?.close()
      }
      mapOf(
        "uri" to result.uri,
        "lifted" to result.lifted,
        "width" to result.width,
        "height" to result.height,
      )
    }
  }

  private fun hasPlayServices(ctx: Context): Boolean =
    GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(ctx) ==
      ConnectionResult.SUCCESS

  /**
   * The model is on the phone; asking ML Kit without it only fails slower.
   * When it is missing, the download is requested and left to run.
   */
  private fun modelReady(ctx: Context, segmenter: SubjectSegmenter): Boolean {
    val client = ModuleInstall.getClient(ctx)
    return try {
      val ready = Tasks.await(client.areModulesAvailable(segmenter)).areModulesAvailable()
      if (!ready) client.installModules(ModuleInstallRequest.newBuilder().addApi(segmenter).build())
      ready
    } catch (_: Exception) {
      false
    }
  }
}
