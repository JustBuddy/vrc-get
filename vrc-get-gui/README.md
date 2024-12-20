# ALCOM

This folder contains the GUI version of vrc-get, ALCOM.

[Homepage (Help Wanted)](https://vrc-get.anatawa12.com/alcom/)

## Installation

The recommended way to install ALCOM is download from [Website][alcom-site].

If you want, you may download the HEAD build from [GitHub Actions][alcom-nightly]

[alcom-site]: https://vrc-get.anatawa12.com/alcom/
[alcom-nightly]: https://github.com/vrc-get/vrc-get/actions/workflows/ci-gui.yml?query=branch%3Amaster

## Supported Platforms

ALCOM runs on macOS, Windows, and Linux.

We support modern versions of the platforms.
Basically, we support the versions that the platform vendor supports.

This support policy is to describe how my limited development resources use so it's welcome
to pull requests that ports ALCOM to an older version of OSes.
However, I won't maintain the backports so may break at any moment, I'll try to not break as possible though.

Here are detailed version support policies for each platform:
Version numbers shown here are as of the writing (Dec 2024), so might be outdated.

- macOS: We support the latest version of macOS that is available for non-vintage and non-obsoleted Macs.\
  This means currently we support macOS 13 (Ventura) or later.
  On macOS, we use WKWebView, which is built-in to macOS, so no additional requirements are needed.
- Windows: We support the latest version of Windows that is supported as mainstream by Microsoft.\
  This means currently we support Windows 10 21H2 or later and Windows 11 23H2 or later.
  On windows, we use WebView2 so WebView2 should also be updated to supported versions.
  Currently, WebView2 with Edge 130 or later is supported.
- Linux: Linux is not well-supported, Linux support is best-effort by the community.\
  No maintainer is using Linux as a primary platform, so we can't guarantee the quality of the Linux version.\
  No specific version is guaranteed to work, but we will try to fix issues with your help.\
  Basically, modern webkit2gtk 4.1 is required to run ALCOM since we use modern web features.

## Requirements (building)

To build ALCOM, you need to have the following installed:

- [Node.js] LTS — to build the web part of the project
- [npm] v10 — to install the dependencies of the web part (bundled with node.js so no extra attention needed in most case)
- [cargo] latest — to build the most part of the project
- [cargo-about] latest — to generate the licenses json (for development, not required but required for building release binary)
- [.NET SDK] v8 — to build vrc-get-litedb crate

Please note that ALCOM requires the latest version of cargo and cargo-about at that time. 
We update the required version of cargo and cargo-about without notice.
Therefore, you may need to update them before building the project.

[Node.js]: https://nodejs.org/en
[npm]: https://www.npmjs.com
[cargo]: https://doc.rust-lang.org/cargo/
[cargo-about]: https://github.com/EmbarkStudios/cargo-about
[.NET SDK]: https://dotnet.microsoft.com/download

## Building

To build the project, run the following command:

```bash
npm run tauri build
```

## Development

ALCOM is currently based on tauri and next.js.

Run `npm run tauri dev` to start the development server and gui.

## Contribution

For how to contribute localization to ALCOM (vrc-get-gui): [CONTRIBUTING.md](CONTRIBUTING.md) (**Please read [../CONTRIBUTING.md#configuration-requirements](../CONTRIBUTING.md#configuration-requirements) first before you read [CONTRIBUTING.md](CONTRIBUTING.md)!**)

## License

ALCOM is licensed under the MIT License. See [LICENSE](../LICENSE) for more information.
