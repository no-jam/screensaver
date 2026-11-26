// The Nojam screensaver for macOS: a ScreenSaverView that shows web/index.html (WebGL 2) in a
// WKWebView, full pixel density, and an Options sheet for the motion, the theme and the pace.
// Build with ../build.sh; it needs only the Xcode command line tools.

import AppKit
import ScreenSaver
import WebKit

@objc(NojamSaverView)
final class NojamSaverView: ScreenSaverView {
    private static let moduleName = "io.nojam.screensaver"
    private var webView: WKWebView?
    private var sheet: NSWindow?
    private var modePopup: NSPopUpButton?
    private var themePopup: NSPopUpButton?
    private var paceSlider: NSSlider?

    private var defaults: ScreenSaverDefaults? {
        ScreenSaverDefaults(forModuleWithName: Self.moduleName)
    }

    override init?(frame: NSRect, isPreview: Bool) {
        super.init(frame: frame, isPreview: isPreview)
        setUp()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setUp()
    }

    deinit {
        DistributedNotificationCenter.default().removeObserver(self)
    }

    // MARK: Settings

    private var mode: String { defaults?.string(forKey: "mode") ?? "drift" }
    private var theme: String { defaults?.string(forKey: "theme") ?? "auto" }
    private var pace: Double {
        let p = defaults?.double(forKey: "pace") ?? 1
        return p > 0 ? p : 1
    }

    private var systemAppearance: String {
        let dark = effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
            || UserDefaults.standard.string(forKey: "AppleInterfaceStyle") == "Dark"
        return dark ? "dark" : "light"
    }

    private func configJSON() -> String {
        let cfg: [String: Any] = [
            "mode": mode, "theme": theme, "system": systemAppearance, "pace": pace,
            "saver": true, "preview": isPreview,
        ]
        let data = (try? JSONSerialization.data(withJSONObject: cfg)) ?? Data("{}".utf8)
        return String(data: data, encoding: .utf8) ?? "{}"
    }

    // MARK: Web view

    private func setUp() {
        defaults?.register(defaults: ["mode": "drift", "theme": "auto", "pace": 1.0])
        animationTimeInterval = 1.0 / 2.0 // the page animates itself; this only keeps the view alive
        wantsLayer = true
        layer?.backgroundColor = NSColor.black.cgColor

        // macOS 14 and later keep the saver's process running after the screen wakes, and do not
        // always call stopAnimation. Stop rendering when the system says the saver stopped.
        DistributedNotificationCenter.default().addObserver(
            self, selector: #selector(screensaverWillStop),
            name: NSNotification.Name("com.apple.screensaver.willstop"), object: nil)

        loadPage()
    }

    private func loadPage() {
        webView?.removeFromSuperview()
        let config = WKWebViewConfiguration()
        config.suppressesIncrementalRendering = true
        config.mediaTypesRequiringUserActionForPlayback = .all
        let script = WKUserScript(
            source: "window.NOJAM = \(configJSON());",
            injectionTime: .atDocumentStart, forMainFrameOnly: true)
        config.userContentController.addUserScript(script)

        let web = WKWebView(frame: bounds, configuration: config)
        web.autoresizingMask = [.width, .height]
        web.setValue(false, forKey: "drawsBackground") // no white flash before the first frame
        if #available(macOS 13.3, *) { web.isInspectable = false }
        addSubview(web)
        webView = web

        let bundle = Bundle(for: NojamSaverView.self)
        if let page = bundle.url(forResource: "index", withExtension: "html") {
            web.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        }
    }

    private func run(_ js: String) {
        webView?.evaluateJavaScript("window.nojam && window.nojam.\(js)", completionHandler: nil)
    }

    override func startAnimation() {
        super.startAnimation()
        if webView == nil { loadPage() }
        run("resume()")
    }

    override func stopAnimation() {
        run("pause()")
        super.stopAnimation()
    }

    @objc private func screensaverWillStop(_ note: Notification) {
        guard !isPreview else { return }
        run("pause()")
        if #available(macOS 14.0, *) {
            // legacyScreenSaver would otherwise keep a paused web view in memory until logout.
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { exit(0) }
        }
    }

    override func animateOneFrame() {}

    override func draw(_ rect: NSRect) {
        NSColor.black.setFill()
        rect.fill()
    }

    // MARK: Options sheet

    override var hasConfigureSheet: Bool { true }

    override var configureSheet: NSWindow? {
        if let sheet { syncControls(); return sheet }

        let w = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 380, height: 214),
            styleMask: [.titled], backing: .buffered, defer: false)
        w.title = "Nojam"
        let v = w.contentView!

        func label(_ text: String, _ y: CGFloat) {
            let l = NSTextField(labelWithString: text)
            l.alignment = .right
            l.frame = NSRect(x: 20, y: y + 3, width: 90, height: 20)
            v.addSubview(l)
        }

        let title = NSTextField(labelWithString: "Suprematist compositions in 3D, in the Nojam colours.")
        title.textColor = .secondaryLabelColor
        title.frame = NSRect(x: 20, y: 176, width: 340, height: 18)
        v.addSubview(title)

        label("Motion:", 136)
        let mp = NSPopUpButton(frame: NSRect(x: 118, y: 134, width: 240, height: 26), pullsDown: false)
        mp.addItems(withTitles: ["Drift: changes slowly", "Shuffle: shapes fly to a new picture"])
        v.addSubview(mp)
        modePopup = mp

        label("Colours:", 100)
        let tp = NSPopUpButton(frame: NSRect(x: 118, y: 98, width: 240, height: 26), pullsDown: false)
        tp.addItems(withTitles: ["Match the system", "Day", "Night"])
        v.addSubview(tp)
        themePopup = tp

        label("Pace:", 64)
        let ps = NSSlider(value: 1, minValue: 0.5, maxValue: 2, target: nil, action: nil)
        ps.frame = NSRect(x: 120, y: 64, width: 236, height: 24)
        ps.numberOfTickMarks = 7
        ps.allowsTickMarkValuesOnly = false
        v.addSubview(ps)
        paceSlider = ps

        let ok = NSButton(title: "OK", target: self, action: #selector(closeSheet(_:)))
        ok.keyEquivalent = "\r"
        ok.bezelStyle = .rounded
        ok.tag = 1
        ok.frame = NSRect(x: 276, y: 14, width: 88, height: 32)
        v.addSubview(ok)

        let cancel = NSButton(title: "Cancel", target: self, action: #selector(closeSheet(_:)))
        cancel.keyEquivalent = "\u{1b}"
        cancel.bezelStyle = .rounded
        cancel.frame = NSRect(x: 184, y: 14, width: 88, height: 32)
        v.addSubview(cancel)

        sheet = w
        syncControls()
        return w
    }

    private func syncControls() {
        modePopup?.selectItem(at: mode == "shuffle" ? 1 : 0)
        themePopup?.selectItem(at: ["auto", "day", "night"].firstIndex(of: theme) ?? 0)
        paceSlider?.doubleValue = pace
    }

    @objc private func closeSheet(_ sender: NSButton) {
        if sender.tag == 1, let d = defaults {
            d.set(modePopup?.indexOfSelectedItem == 1 ? "shuffle" : "drift", forKey: "mode")
            d.set(["auto", "day", "night"][max(0, themePopup?.indexOfSelectedItem ?? 0)], forKey: "theme")
            d.set(paceSlider?.doubleValue ?? 1, forKey: "pace")
            d.synchronize()
            run("set(\(configJSON()))")
        }
        guard let sheet else { return }
        if let parent = sheet.sheetParent { parent.endSheet(sheet) } else { sheet.orderOut(nil) }
    }
}
