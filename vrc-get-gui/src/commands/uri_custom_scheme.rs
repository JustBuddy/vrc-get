use serde::Serialize;
use std::borrow::Cow;
use tauri::http::{Request, Response};
use tauri::{AppHandle, Manager};

use crate::commands::DEFAULT_UNITY_ARGUMENTS;
use crate::state::GuiConfigState;

pub fn handle_vrc_get_scheme(
    app: &AppHandle,
    request: Request<Vec<u8>>,
) -> Response<Cow<'static, [u8]>> {
    let url = request.uri();
    log::info!("recived request: {url}");
    if url.scheme().map(|x| x.as_str()) != Some("vrc-get") {
        return Response::builder()
            .status(404)
            .body(b"bad sceme".into())
            .unwrap();
    };
    match url.path() {
        "/global-info.js" => global_info_json(app),
        _ => Response::builder()
            .status(404)
            .body(b"bad url".into())
            .unwrap(),
    }
}

pub fn global_info_json(app: &AppHandle) -> Response<Cow<'static, [u8]>> {
    let config = app.state::<GuiConfigState>();
    let config = config.get();

    // keep structure sync with global-info.ts
    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    struct GlobalInfo<'a> {
        language: &'a str,
        theme: &'a str,
        version: &'a str,
        commit_hash: Option<&'a str>,
        os_type: &'a str,
        arch: &'a str,
        os_info: &'a str,
        local_app_data: &'a str,
        default_unity_arguments: &'a [&'a str],
    }

    #[cfg(target_os = "macos")]
    let os_type = "Darwin";
    #[cfg(target_os = "windows")]
    let os_type = "WindowsNT";
    #[cfg(target_os = "linux")]
    let os_type = "Linux";

    #[cfg(target_arch = "x86_64")]
    let arch = "x86_64";
    #[cfg(target_arch = "aarch64")]
    let arch = "aarch64";

    let os_info = crate::os::os_info();

    #[cfg(windows)]
    let local_app_data = crate::os::local_app_data();
    #[cfg(not(windows))]
    let local_app_data = "";

    let global_info = GlobalInfo {
        language: &config.language,
        theme: &config.theme,
        version: env!("CARGO_PKG_VERSION"),
        commit_hash: option_env!("COMMIT_HASH"),
        os_type,
        arch,
        os_info,
        local_app_data,
        default_unity_arguments: DEFAULT_UNITY_ARGUMENTS,
    };

    let mut script = b"globalThis.vrcGetGlobalInfo = ".to_vec();

    serde_json::to_writer(&mut script, &global_info).expect("failed to serialize global info");

    drop(config);

    Response::builder()
        .status(200)
        .header("content-type", "application/javascript")
        .body(script.into())
        .unwrap()
}
