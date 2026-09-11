// QR rendering for the LAN pairing flow (ADR-029 §Pairing).
//
// The QR encodes a `cachink-lan://<host>:<port>?token=…` URL so the Expo
// client can pick both the server URL and the ephemeral pairing token
// from a single scan.

use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::{codecs::png::PngEncoder, ExtendedColorType, ImageEncoder};
use qrcode::{EcLevel, QrCode};
use std::net::SocketAddr;

/// Build the `cachink-lan://…` pairing URL. Kept in one place so the Rust
/// server and any desktop documentation reference the same shape.
pub fn pairing_url(addr: SocketAddr, token: &str) -> String {
    format!("cachink-lan://{addr}?token={token}")
}

/// Render the pairing QR as a base64-encoded PNG, sized 512×512. Exposed
/// to the renderer via `lan_server_start` (see `mod.rs`).
pub fn render_pairing_qr(addr: SocketAddr, token: &str) -> Result<String, String> {
    let url = pairing_url(addr, token);
    let code = QrCode::with_error_correction_level(url.as_bytes(), EcLevel::M)
        .map_err(|e| format!("qrcode: {e}"))?;
    let img = code.render::<image::Luma<u8>>().quiet_zone(true).build();

    let (w, h) = (img.width(), img.height());
    let raw = img.into_raw();
    let mut png: Vec<u8> = Vec::with_capacity(raw.len());
    PngEncoder::new(&mut png)
        .write_image(&raw, w, h, ExtendedColorType::L8)
        .map_err(|e| format!("png encode: {e}"))?;

    Ok(STANDARD.encode(&png))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pairing_url_format_is_stable() {
        let addr: SocketAddr = "127.0.0.1:43812".parse().unwrap();
        assert_eq!(
            pairing_url(addr, "abc123"),
            "cachink-lan://127.0.0.1:43812?token=abc123"
        );
    }

    #[test]
    fn render_pairing_qr_produces_non_empty_base64_png() {
        let addr: SocketAddr = "127.0.0.1:43812".parse().unwrap();
        let b64 = render_pairing_qr(addr, "abc123").expect("render QR");
        assert!(!b64.is_empty());
        // PNG files always start with the magic bytes 0x89 0x50 0x4E 0x47;
        // base64("\x89PNG") begins with "iVBOR".
        assert!(b64.starts_with("iVBOR"));
    }
}
