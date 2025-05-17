import $ from "jquery";
(window as any).$ = $;
(window as any).jQuery = $;

$("body").show();

await import("./desktop_main.js");
