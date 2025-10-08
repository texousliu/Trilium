import $ from "jquery";

async function loadBootstrap() {
    if (glob.isRtl) {
        await import("bootstrap/dist/css/bootstrap.rtl.min.css");
    } else {
        await import("bootstrap/dist/css/bootstrap.min.css");
    }
}

(window as any).$ = $;
(window as any).jQuery = $;
await loadBootstrap();

$("body").show();
