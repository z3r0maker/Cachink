import ExpoModulesCore

/// The product photo's lift (M-13, ADR-134), as JavaScript calls it.
///
/// `lift(uri)` reads the photo at a `file://` URI and writes a PNG beside the
/// app's temporary files: the subject cut out and cropped to its mask when
/// Vision finds one (`lifted: true`), else a centred square crop of the whole
/// photo (`lifted: false`). Either way the PNG is at most 1024 px a side.
/// Nothing here throws for an unsupported phone: iOS 16, the simulator or a
/// photo with no clear subject all come back as the square crop.
public class SubjectLiftModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectLift")

    AsyncFunction("lift") { (uri: String) -> [String: Any] in
      let result = try SubjectLifter.lift(uri: uri)
      return [
        "uri": result.url.absoluteString,
        "lifted": result.lifted,
        "width": result.width,
        "height": result.height,
      ]
    }
  }
}

/// The photo could not be read at all — not an unsupported phone, a bad URI.
internal final class PhotoUnreadableException: GenericException<String> {
  override var reason: String {
    "No se pudo leer la foto en \(param)"
  }
}

/// The PNG could not be written to the temporary directory.
internal final class CutoutWriteException: Exception {
  override var reason: String {
    "No se pudo guardar el recorte de la foto"
  }
}
