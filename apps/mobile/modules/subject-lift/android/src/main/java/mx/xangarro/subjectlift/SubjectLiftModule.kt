package mx.xangarro.subjectlift

import android.content.Context
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import com.google.android.gms.tasks.Tasks
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The product photo's lift (M-13, ADR-134), as JavaScript calls it.
 *
 * `prepare()` runs at app start: with Google Play services present it asks
 * ModuleInstallClient for the subject-segmentation model, so the first photo
 * usually finds it there. `lift(uri)` writes a PNG to the cache directory —
 * the subject cropped to its mask (`lifted: true`) or a centred square crop
 * (`lifted: false`) when there is no Play services, no model yet or no
 * subject. Neither ever blocks the photo.
 */
class SubjectLiftModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SubjectLift")

    AsyncFunction("prepare") {
      val ctx = context
      if (!hasPlayServices(ctx)) return@AsyncFunction false
      val request = ModuleInstallRequest.newBuilder()
        .addApi(SubjectLifter.segmenter())
        .build()
      // Fire and forget: the download carries on without the app watching.
      ModuleInstall.getClient(ctx).installModules(request)
      true
    }

    AsyncFunction("lift") { uri: String ->
      val ctx = context
      val result = SubjectLifter(ctx).lift(uri, canSegment = modelReady(ctx))
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

  /** The model is on the phone; asking ML Kit without it only fails slower. */
  private fun modelReady(ctx: Context): Boolean {
    if (!hasPlayServices(ctx)) return false
    return try {
      Tasks.await(ModuleInstall.getClient(ctx).areModulesAvailable(SubjectLifter.segmenter()))
        .areModulesAvailable()
    } catch (_: Exception) {
      false
    }
  }
}
