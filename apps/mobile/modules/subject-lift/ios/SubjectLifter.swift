import CoreImage
import UIKit
import Vision

/// What `lift` hands back: the PNG on disk, its size, and whether the
/// background came off.
struct LiftResult {
  let url: URL
  let lifted: Bool
  let width: Int
  let height: Int
}

/// The lift itself, apart from the module's bridge so it reads top to bottom.
///
/// Vision's `VNGenerateForegroundInstanceMaskRequest` (iOS 17) separates
/// every foreground instance from the background; all of them are kept, so a
/// six-pack stays six cans. `VNGeneratePersonSegmentationRequest` is not a
/// fallback on iOS 16: products are not people (ADR-134).
enum SubjectLifter {
  /// The cutout's longest side (ADR-134): the encoder scales it to 512.
  static let maxSide: CGFloat = 1024
  /// Photos are read down to this before Vision sees them, to bound memory.
  static let workingSide: CGFloat = 2048

  private static let context = CIContext(options: nil)

  static func lift(uri: String) throws -> LiftResult {
    guard let source = loadUpright(uri: uri) else {
      throw PhotoUnreadableException(uri)
    }
    if let cutout = foreground(of: source) {
      return try write(fitted(cutout), lifted: true)
    }
    return try write(fitted(centredSquare(of: source)), lifted: false)
  }

  /// The photo, upright (EXIF orientation applied), at most `workingSide`.
  private static func loadUpright(uri: String) -> CGImage? {
    let path = URL(string: uri)?.path ?? uri
    guard let image = UIImage(contentsOfFile: path) else { return nil }
    return redraw(image, side: workingSide)
  }

  /// The subject cut out and cropped to its mask, or nil when it cannot be.
  private static func foreground(of image: CGImage) -> CGImage? {
    guard #available(iOS 17.0, *) else { return nil }
    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    do {
      // The simulator has no Neural Engine path for this request: it throws,
      // and the photo goes through as the square crop.
      try handler.perform([request])
      guard let observation = request.results?.first,
            !observation.allInstances.isEmpty else { return nil }
      let buffer = try observation.generateMaskedImage(
        ofInstances: observation.allInstances,
        from: handler,
        croppedToInstancesExtent: true
      )
      let masked = CIImage(cvPixelBuffer: buffer)
      return context.createCGImage(masked, from: masked.extent)
    } catch {
      return nil
    }
  }

  /// The largest centred square of the photo, for `lifted: false`.
  private static func centredSquare(of image: CGImage) -> CGImage {
    let side = min(image.width, image.height)
    let rect = CGRect(
      x: (image.width - side) / 2,
      y: (image.height - side) / 2,
      width: side,
      height: side
    )
    return image.cropping(to: rect) ?? image
  }

  /// At most `maxSide` a side, transparency kept.
  private static func fitted(_ image: CGImage) -> CGImage {
    redraw(UIImage(cgImage: image), side: maxSide) ?? image
  }

  /// Redraws an image upright, scaled down to `side` if larger, never up.
  private static func redraw(_ image: UIImage, side: CGFloat) -> CGImage? {
    let longest = max(image.size.width, image.size.height)
    guard longest > 0 else { return nil }
    let scale = min(1, side / longest)
    let size = CGSize(
      width: (image.size.width * scale).rounded(),
      height: (image.size.height * scale).rounded()
    )
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    format.opaque = false
    let out = UIGraphicsImageRenderer(size: size, format: format).image { _ in
      image.draw(in: CGRect(origin: .zero, size: size))
    }
    return out.cgImage
  }

  private static func write(_ image: CGImage, lifted: Bool) throws -> LiftResult {
    guard let png = UIImage(cgImage: image).pngData() else { throw CutoutWriteException() }
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent("subject-lift-\(UUID().uuidString).png")
    do {
      try png.write(to: url, options: .atomic)
    } catch {
      throw CutoutWriteException()
    }
    return LiftResult(url: url, lifted: lifted, width: image.width, height: image.height)
  }
}
