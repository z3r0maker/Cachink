Pod::Spec.new do |s|
  s.name           = 'SubjectLift'
  s.version        = '1.0.0'
  s.summary        = 'Lifts a product off its background with Apple Vision (M-13, ADR-134).'
  s.description    = 'VNGenerateForegroundInstanceMaskRequest on iOS 17; a centred square crop otherwise.'
  s.author         = 'Xangarro'
  s.homepage       = 'https://xangarro.mx'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision', 'CoreImage', 'UIKit'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
