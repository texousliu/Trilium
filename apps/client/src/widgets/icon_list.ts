// taken from the HTML source of https://boxicons.com/

export interface Icon {
    name: string;
    slug: string;
    type_of_icon: "REGULAR" | "SOLID" | "LOGO";
    term?: string[];
    className?: string;
}

const icons: Icon[] = [
    {
        name: "empty",
        slug: "empty",
        type_of_icon: "REGULAR"
    },
    {
        name: "child",
        slug: "child-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "balloon",
        slug: "balloon-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "coffee-bean",
        slug: "coffee-bean-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pear",
        slug: "pear-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "sushi",
        slug: "sushi-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "sushi",
        slug: "sushi-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shower",
        slug: "shower-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shower",
        slug: "shower-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "typescript",
        slug: "typescript-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "graphql",
        slug: "graphql-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "rfid",
        slug: "rfid-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "universal-access",
        slug: "universal-access-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "universal-access",
        slug: "universal-access-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "castle",
        slug: "castle-solid",
        type_of_icon: "SOLID",
        term: ["fort", "secure"]
    },
    {
        name: "shield-minus",
        slug: "shield-minus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shield-minus",
        slug: "shield-minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shield-plus",
        slug: "shield-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shield-plus",
        slug: "shield-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "vertical-bottom",
        slug: "vertical-bottom-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "vertical-top",
        slug: "vertical-top-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "horizontal-right",
        slug: "horizontal-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "horizontal-left",
        slug: "horizontal-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "objects-vertical-bottom",
        slug: "objects-vertical-bottom-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "objects-vertical-bottom",
        slug: "objects-vertical-bottom-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "objects-vertical-center",
        slug: "objects-vertical-center-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "objects-vertical-center",
        slug: "objects-vertical-center-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "objects-vertical-top",
        slug: "objects-vertical-top-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "objects-vertical-top",
        slug: "objects-vertical-top-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "objects-horizontal-right",
        slug: "objects-horizontal-right-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "objects-horizontal-right",
        slug: "objects-horizontal-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "objects-horizontal-center",
        slug: "objects-horizontal-center-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "objects-horizontal-center",
        slug: "objects-horizontal-center-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "objects-horizontal-left",
        slug: "objects-horizontal-left-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "objects-horizontal-left",
        slug: "objects-horizontal-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "color",
        slug: "color-solid",
        type_of_icon: "SOLID",
        term: ["palette", "wheel"]
    },
    {
        name: "color",
        slug: "color-regular",
        type_of_icon: "REGULAR",
        term: ["palette", "wheel"]
    },
    {
        name: "reflect-horizontal",
        slug: "reflect-horizontal-regular",
        type_of_icon: "REGULAR",
        term: ["flip"]
    },
    {
        name: "reflect-vertical",
        slug: "reflect-vertical-regular",
        type_of_icon: "REGULAR",
        term: ["flip"]
    },
    {
        name: "postgresql",
        slug: "postgresql-logo",
        type_of_icon: "LOGO",
        term: ["database", "db", "sql"]
    },
    {
        name: "mongodb",
        slug: "mongodb-logo",
        type_of_icon: "LOGO",
        term: ["database", "db"]
    },
    {
        name: "deezer",
        slug: "deezer-logo",
        type_of_icon: "LOGO",
        term: ["music"]
    },
    {
        name: "xing",
        slug: "xing-logo",
        type_of_icon: "LOGO",
        term: ["search"]
    },
    {
        name: "cart-add",
        slug: "cart-add-regular",
        type_of_icon: "REGULAR",
        term: ["buy"]
    },
    {
        name: "cart-download",
        slug: "cart-download-regular",
        type_of_icon: "REGULAR",
        term: ["buy"]
    },
    {
        name: "no-signal",
        slug: "no-signal-regular",
        type_of_icon: "REGULAR",
        term: ["network", "connection"]
    },
    {
        name: "signal-5",
        slug: "signal-5-regular",
        type_of_icon: "REGULAR",
        term: ["network", "connection"]
    },
    {
        name: "signal-4",
        slug: "signal-4-regular",
        type_of_icon: "REGULAR",
        term: ["network", "connection"]
    },
    {
        name: "signal-3",
        slug: "signal-3-regular",
        type_of_icon: "REGULAR",
        term: ["network", "connection"]
    },
    {
        name: "signal-2",
        slug: "signal-2-regular",
        type_of_icon: "REGULAR",
        term: ["network", "connection"]
    },
    {
        name: "signal-1",
        slug: "signal-1-regular",
        type_of_icon: "REGULAR",
        term: ["network", "connection"]
    },
    {
        name: "cheese",
        slug: "cheese-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cheese",
        slug: "cheese-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "hard-hat",
        slug: "hard-hat-solid",
        type_of_icon: "SOLID",
        term: ["construction", "worker", "labour"]
    },
    {
        name: "hard-hat",
        slug: "hard-hat-regular",
        type_of_icon: "REGULAR",
        term: ["construction", "worker", "labour"]
    },
    {
        name: "home-alt-2",
        slug: "home-alt-2-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "home-alt-2",
        slug: "home-alt-2-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "meta",
        slug: "meta-logo",
        type_of_icon: "LOGO",
        term: ["facebook", "social media"]
    },
    {
        name: "lemon",
        slug: "lemon-solid",
        type_of_icon: "SOLID",
        term: ["lime", "fruit", "vegetable"]
    },
    {
        name: "lemon",
        slug: "lemon-regular",
        type_of_icon: "REGULAR",
        term: ["lime", "fruit", "vegetable"]
    },
    {
        name: "cable-car",
        slug: "cable-car-solid",
        type_of_icon: "SOLID",
        term: ["transportation", "hill", "travel"]
    },
    {
        name: "cable-car",
        slug: "cable-car-regular",
        type_of_icon: "REGULAR",
        term: ["transportation", "hill", "travel"]
    },
    {
        name: "cricket-ball",
        slug: "cricket-ball-solid",
        type_of_icon: "SOLID",
        term: ["sport"]
    },
    {
        name: "cricket-ball",
        slug: "cricket-ball-regular",
        type_of_icon: "REGULAR",
        term: ["sport"]
    },
    {
        name: "tree-alt",
        slug: "tree-alt-solid",
        type_of_icon: "SOLID",
        term: ["forest", "christmas"]
    },
    {
        name: "male-female",
        slug: "male-female-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "invader",
        slug: "invader-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "baguette",
        slug: "baguette-solid",
        type_of_icon: "SOLID",
        term: ["bread", "bake", "baking", "food", "nutrition"]
    },
    {
        name: "baguette",
        slug: "baguette-regular",
        type_of_icon: "REGULAR",
        term: ["bread", "bake", "baking", "food", "nutrition"]
    },
    {
        name: "fork",
        slug: "fork-regular",
        type_of_icon: "REGULAR",
        term: ["utensil", "restaurant"]
    },
    {
        name: "knife",
        slug: "knife-regular",
        type_of_icon: "REGULAR",
        term: ["utensil", "restaurant"]
    },
    {
        name: "circle-half",
        slug: "circle-half-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "circle-half",
        slug: "circle-half-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "circle-three-quarter",
        slug: "circle-three-quarter-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "circle-three-quarter",
        slug: "circle-three-quarter-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "circle-quarter",
        slug: "circle-quarter-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "circle-quarter",
        slug: "circle-quarter-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bowl-rice",
        slug: "bowl-rice-solid",
        type_of_icon: "SOLID",
        term: ["food"]
    },
    {
        name: "bowl-rice",
        slug: "bowl-rice-regular",
        type_of_icon: "REGULAR",
        term: ["food"]
    },
    {
        name: "bowl-hot",
        slug: "bowl-hot-solid",
        type_of_icon: "SOLID",
        term: ["food", "heat"]
    },
    {
        name: "bowl-hot",
        slug: "bowl-hot-regular",
        type_of_icon: "REGULAR",
        term: ["food", "heat"]
    },
    {
        name: "popsicle",
        slug: "popsicle-solid",
        type_of_icon: "SOLID",
        term: ["ice cream", "dessert"]
    },
    {
        name: "popsicle",
        slug: "popsicle-regular",
        type_of_icon: "REGULAR",
        term: ["ice cream", "dessert"]
    },
    {
        name: "cross",
        slug: "cross-regular",
        type_of_icon: "REGULAR",
        term: ["gaming", "crosshair", "aim"]
    },
    {
        name: "scatter-chart",
        slug: "scatter-chart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "money-withdraw",
        slug: "money-withdraw-regular",
        type_of_icon: "REGULAR",
        term: ["atm"]
    },
    {
        name: "candles",
        slug: "candles-regular",
        type_of_icon: "REGULAR",
        term: ["trading", "stock"]
    },
    {
        name: "math",
        slug: "math-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "party",
        slug: "party-regular",
        type_of_icon: "REGULAR",
        term: ["celebration"]
    },
    {
        name: "leaf",
        slug: "leaf-regular",
        type_of_icon: "REGULAR",
        term: ["plant", "crop", "nature"]
    },
    {
        name: "injection",
        slug: "injection-regular",
        type_of_icon: "REGULAR",
        term: ["syringe", "dose"]
    },
    {
        name: "expand-vertical",
        slug: "expand-vertical-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "expand-horizontal",
        slug: "expand-horizontal-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "collapse-vertical",
        slug: "collapse-vertical-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "collapse-horizontal",
        slug: "collapse-horizontal-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "collapse-alt",
        slug: "collapse-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "party",
        slug: "party-solid",
        type_of_icon: "SOLID",
        term: ["celebration"]
    },
    {
        name: "leaf",
        slug: "leaf-solid",
        type_of_icon: "SOLID",
        term: ["plant", "crop", "nature"]
    },
    {
        name: "injection",
        slug: "injection-solid",
        type_of_icon: "SOLID",
        term: ["syringe", "dose"]
    },
    {
        name: "dog",
        slug: "dog-solid",
        type_of_icon: "SOLID",
        term: ["pet", "canine"]
    },
    {
        name: "cat",
        slug: "cat-solid",
        type_of_icon: "SOLID",
        term: ["pet"]
    },
    {
        name: "upwork",
        slug: "upwork-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "netlify",
        slug: "netlify-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "java",
        slug: "java-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "heroku",
        slug: "heroku-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "go-lang",
        slug: "go-lang-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "gmail",
        slug: "gmail-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "flask",
        slug: "flask-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "99designs",
        slug: "99designs-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "venmo",
        slug: "venmo-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "qr",
        slug: "qr-REGULAR",
        type_of_icon: "REGULAR"
    },
    {
        name: "qr-scan",
        slug: "qr-scan-logo",
        type_of_icon: "REGULAR"
    },
    {
        name: "docker",
        slug: "docker-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "aws",
        slug: "aws-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "hand",
        slug: "hand",
        type_of_icon: "SOLID",
        term: ["palm", "stop"]
    },
    {
        name: "podcast",
        slug: "podcast-regular",
        type_of_icon: "REGULAR",
        term: ["audiobook", "radio"]
    },
    {
        name: "checkbox-minus",
        slug: "checkbox-minus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "checkbox-minus",
        slug: "checkbox-minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "speaker",
        slug: "speaker-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "speaker",
        slug: "speaker-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "registered",
        slug: "registered-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "registered",
        slug: "registered-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "phone-off",
        slug: "phone-off-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "phone-off",
        slug: "phone-off-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "tiktok",
        slug: "tiktok-logo",
        type_of_icon: "LOGO",
        term: ["social media", "entertainment"]
    },
    {
        name: "sketch",
        slug: "sketch-logo",
        type_of_icon: "LOGO",
        term: ["web design"]
    },
    {
        name: "steam",
        slug: "steam-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "trip-advisor",
        slug: "trip-advisor-logo",
        type_of_icon: "LOGO",
        term: ["travel"]
    },
    {
        name: "visual-studio",
        slug: "visual-studio-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "unity",
        slug: "unity-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "php",
        slug: "php-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "discord-alt",
        slug: "discord-alt-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "flutter",
        slug: "flutter-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "mastodon",
        slug: "mastodon-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "tailwind-css",
        slug: "tailwind-css-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "buildings",
        slug: "buildings-regular",
        type_of_icon: "REGULAR",
        term: ["city", "colony", "skyline", "skyscrapers"]
    },
    {
        name: "buildings",
        slug: "buildings-solid",
        type_of_icon: "SOLID",
        term: ["city", "colony", "skyline", "skyscrapers"]
    },
    {
        name: "store-alt",
        slug: "store-alt-regular",
        type_of_icon: "REGULAR",
        term: ["shop", "market"]
    },
    {
        name: "store-alt",
        slug: "store-alt-solid",
        type_of_icon: "SOLID",
        term: ["shop", "market"]
    },
    {
        name: "bar-chart-alt-2",
        slug: "bar-chart-alt-2-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bar-chart-alt-2",
        slug: "bar-chart-alt-2-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-dots",
        slug: "message-dots-regular",
        type_of_icon: "REGULAR",
        term: ["loading", "chat", "comment"]
    },
    {
        name: "message-dots",
        slug: "message-dots-solid",
        type_of_icon: "SOLID",
        term: ["loading", "chat", "comment"]
    },
    {
        name: "message-rounded-dots",
        slug: "message-rounded-dots-regular",
        type_of_icon: "REGULAR",
        term: ["loading", "chat", "comment"]
    },
    {
        name: "message-rounded-dots",
        slug: "message-rounded-dots-solid",
        type_of_icon: "SOLID",
        term: ["loading", "chat", "comment"]
    },
    {
        name: "devices",
        slug: "devices-solid",
        type_of_icon: "SOLID",
        term: ["mobile", "tab"]
    },
    {
        name: "memory-card",
        slug: "memory-card-regular",
        type_of_icon: "REGULAR",
        term: ["sd card", "storage"]
    },
    {
        name: "memory-card",
        slug: "memory-card-solid",
        type_of_icon: "SOLID",
        term: ["sd card", "storage"]
    },
    {
        name: "wallet-alt",
        slug: "wallet-alt-regular",
        type_of_icon: "REGULAR",
        term: ["money"]
    },
    {
        name: "wallet-alt",
        slug: "wallet-alt-solid",
        type_of_icon: "SOLID",
        term: ["money"]
    },
    {
        name: "bank",
        slug: "bank-solid",
        type_of_icon: "SOLID",
        term: ["institution", "money", "safe"]
    },
    {
        name: "slideshow",
        slug: "slideshow-regular",
        type_of_icon: "REGULAR",
        term: ["presentation", "keynote"]
    },
    {
        name: "slideshow",
        slug: "slideshow-solid",
        type_of_icon: "SOLID",
        term: ["presentation", "keynote"]
    },
    {
        name: "message-square",
        slug: "message-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-square-dots",
        slug: "message-square-dots-regular",
        type_of_icon: "REGULAR",
        term: ["loading", "chat", "comment"]
    },
    {
        name: "message-square",
        slug: "message-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-square-dots",
        slug: "message-square-dots-solid",
        type_of_icon: "SOLID",
        term: ["loading", "chat", "comment"]
    },
    {
        name: "book-content",
        slug: "book-content-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "book-content",
        slug: "book-content-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chat",
        slug: "chat-regular",
        type_of_icon: "REGULAR",
        term: ["discussion", "talk", "comments", "messages"]
    },
    {
        name: "chat",
        slug: "chat-solid",
        type_of_icon: "SOLID",
        term: ["discussion", "talk", "comments", "messages"]
    },
    {
        name: "edit-alt",
        slug: "edit-alt-regular",
        type_of_icon: "REGULAR",
        term: ["writing", "note", "pencil"]
    },
    {
        name: "edit-alt",
        slug: "edit-alt-solid",
        type_of_icon: "SOLID",
        term: ["writing", "note", "pencil"]
    },
    {
        name: "mouse-alt",
        slug: "mouse-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "mouse-alt",
        slug: "mouse-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bug-alt",
        slug: "bug-alt-regular",
        type_of_icon: "REGULAR",
        term: ["error", "warning"]
    },
    {
        name: "bug-alt",
        slug: "bug-alt-solid",
        type_of_icon: "SOLID",
        term: ["error", "warning"]
    },
    {
        name: "notepad",
        slug: "notepad-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "notepad",
        slug: "notepad-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "video-recording",
        slug: "video-recording-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "video-recording",
        slug: "video-recording-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shape-square",
        slug: "shape-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shape-triangle",
        slug: "shape-triangle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "direction-left",
        slug: "direction-left-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "ghost",
        slug: "ghost-regular",
        type_of_icon: "REGULAR",
        term: ["spooky", "horror", "scary"]
    },
    {
        name: "ghost",
        slug: "ghost-solid",
        type_of_icon: "SOLID",
        term: ["spooky", "horror", "scary"]
    },
    {
        name: "mail-send",
        slug: "mail-send-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "code-alt",
        slug: "code-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "grid",
        slug: "grid-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "quote-single-left",
        slug: "quote-single-left-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "quote-single-right",
        slug: "quote-single-right-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-pin",
        slug: "user-pin-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "user-pin",
        slug: "user-pin-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "run",
        slug: "run-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "copy-alt",
        slug: "copy-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "copy-alt",
        slug: "copy-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "transfer-alt",
        slug: "transfer-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "file-doc",
        slug: "file-doc-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-html",
        slug: "file-html-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "comment-detail",
        slug: "comment-detail-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "comment-add",
        slug: "comment-add-solid",
        type_of_icon: "SOLID",
        term: ["chat", "message", "new", "plus"]
    },
    {
        name: "file-css",
        slug: "file-css-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-js",
        slug: "file-js-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-json",
        slug: "file-json-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-md",
        slug: "file-md-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-txt",
        slug: "file-txt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-png",
        slug: "file-png-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-jpg",
        slug: "file-jpg-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-gif",
        slug: "file-gif-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "analyse",
        slug: "analyse-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "book-open",
        slug: "book-open-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "plane-take-off",
        slug: "plane-take-off-solid",
        type_of_icon: "SOLID",
        term: ["flight", "fly"]
    },
    {
        name: "plane-land",
        slug: "plane-land-solid",
        type_of_icon: "SOLID",
        term: ["flight", "fly", "landing"]
    },
    {
        name: "parking",
        slug: "parking-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "id-card",
        slug: "id-card-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "adjust-alt",
        slug: "adjust-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "landscape",
        slug: "landscape-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "landscape",
        slug: "landscape-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "traffic",
        slug: "traffic-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "comment",
        slug: "comment-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "comment",
        slug: "comment-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "comment-dots",
        slug: "comment-dots-regular",
        type_of_icon: "REGULAR",
        term: ["loading", "message", "chat"]
    },
    {
        name: "comment-dots",
        slug: "comment-dots-solid",
        type_of_icon: "SOLID",
        term: ["loading", "message", "chat"]
    },
    {
        name: "wine",
        slug: "wine-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pyramid",
        slug: "pyramid-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pyramid",
        slug: "pyramid-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cylinder",
        slug: "cylinder-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cylinder",
        slug: "cylinder-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "graduation",
        slug: "graduation-solid",
        type_of_icon: "SOLID",
        term: ["scholar", "college"]
    },
    {
        name: "lock-alt",
        slug: "lock-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "lock-alt",
        slug: "lock-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "lock-open-alt",
        slug: "lock-open-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "lock-open-alt",
        slug: "lock-open-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "hourglass-top",
        slug: "hourglass-top-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "hourglass-bottom",
        slug: "hourglass-bottom-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "left-arrow-alt",
        slug: "left-arrow-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "right-arrow-alt",
        slug: "right-arrow-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "up-arrow-alt",
        slug: "up-arrow-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "down-arrow-alt",
        slug: "down-arrow-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shape-circle",
        slug: "shape-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cycling",
        slug: "cycling-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dna",
        slug: "dna-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bowling-ball",
        slug: "bowling-ball-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bowling-ball",
        slug: "bowling-ball-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "search-alt-2",
        slug: "search-alt-2-regular",
        type_of_icon: "REGULAR",
        term: ["magnifying glass"]
    },
    {
        name: "search-alt-2",
        slug: "search-alt-2-solid",
        type_of_icon: "SOLID",
        term: ["magnifying glass"]
    },
    {
        name: "plus-medical",
        slug: "plus-medical-regular",
        type_of_icon: "REGULAR",
        term: ["hospital", "doctor", "medicine"]
    },
    {
        name: "street-view",
        slug: "street-view-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "droplet",
        slug: "droplet-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "droplet-half",
        slug: "droplet-half-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "paint-roll",
        slug: "paint-roll-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "paint-roll",
        slug: "paint-roll-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shield-alt-2",
        slug: "shield-alt-2-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shield-alt-2",
        slug: "shield-alt-2-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "error-alt",
        slug: "error-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "error-alt",
        slug: "error-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "square",
        slug: "square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "square",
        slug: "square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "square-rounded",
        slug: "square-rounded-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "square-rounded",
        slug: "square-rounded-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "polygon",
        slug: "polygon-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "polygon",
        slug: "polygon-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cube-alt",
        slug: "cube-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cube-alt",
        slug: "cube-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cuboid",
        slug: "cuboid-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cuboid",
        slug: "cuboid-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-voice",
        slug: "user-voice-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "user-voice",
        slug: "user-voice-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "accessibility",
        slug: "accessibility-regular",
        type_of_icon: "REGULAR",
        term: ["handicap", "wheelchair", "injury"]
    },
    {
        name: "building-house",
        slug: "building-house-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "building-house",
        slug: "building-house-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "doughnut-chart",
        slug: "doughnut-chart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "doughnut-chart",
        slug: "doughnut-chart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "circle",
        slug: "circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "log-in-circle",
        slug: "log-in-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "log-in-circle",
        slug: "log-in-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "log-out-circle",
        slug: "log-out-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "log-out-circle",
        slug: "log-out-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "log-in",
        slug: "log-in-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "log-out",
        slug: "log-out-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "notification",
        slug: "notification-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "notification-off",
        slug: "notification-off-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "check-square",
        slug: "check-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "check-square",
        slug: "check-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-alt",
        slug: "message-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-alt",
        slug: "message-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-alt-dots",
        slug: "message-alt-dots-regular",
        type_of_icon: "REGULAR",
        term: ["loading", "chat", "comment"]
    },
    {
        name: "message-alt-dots",
        slug: "message-alt-dots-solid",
        type_of_icon: "SOLID",
        term: ["loading", "chat", "comment"]
    },
    {
        name: "no-entry",
        slug: "no-entry-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "no-entry",
        slug: "no-entry-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "traffic-barrier",
        slug: "traffic-barrier-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "component",
        slug: "component-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "plane-alt",
        slug: "plane-alt-solid",
        type_of_icon: "SOLID",
        term: ["flight", "fly"]
    },
    {
        name: "palette",
        slug: "palette-regular",
        type_of_icon: "REGULAR",
        term: ["color", "colour", "painting"]
    },
    {
        name: "palette",
        slug: "palette-solid",
        type_of_icon: "SOLID",
        term: ["color", "colour", "painting"]
    },
    {
        name: "basket",
        slug: "basket-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "basket",
        slug: "basket-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "purchase-tag-alt",
        slug: "purchase-tag-alt-regular",
        type_of_icon: "REGULAR",
        term: ["price", "cost"]
    },
    {
        name: "purchase-tag-alt",
        slug: "purchase-tag-alt-solid",
        type_of_icon: "SOLID",
        term: ["price", "cost"]
    },
    {
        name: "receipt",
        slug: "receipt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "receipt",
        slug: "receipt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "line-chart",
        slug: "line-chart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "map-pin",
        slug: "map-pin-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "map-pin",
        slug: "map-pin-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "hive",
        slug: "hive-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "band-aid",
        slug: "band-aid-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "band-aid",
        slug: "band-aid-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "credit-card-alt",
        slug: "credit-card-alt-regular",
        type_of_icon: "REGULAR",
        term: ["finance", "money", "debit"]
    },
    {
        name: "credit-card-alt",
        slug: "credit-card-alt-solid",
        type_of_icon: "SOLID",
        term: ["finance", "money", "debit"]
    },
    {
        name: "credit-card",
        slug: "credit-card-solid",
        type_of_icon: "SOLID",
        term: ["finance", "money", "debit"]
    },
    {
        name: "wifi-off",
        slug: "wifi-off-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "paint",
        slug: "paint-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "brightness-half",
        slug: "brightness-half-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "brightness-half",
        slug: "brightness-half-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "brightness",
        slug: "brightness-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "brightness",
        slug: "brightness-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "filter-alt",
        slug: "filter-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dialpad-alt",
        slug: "dialpad-alt-regular",
        type_of_icon: "REGULAR",
        term: ["keypad"]
    },
    {
        name: "border-inline-end",
        slug: "border-inline-end-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "border-left",
        slug: "border-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "border-top",
        slug: "border-top-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "border-bottom",
        slug: "border-bottom-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "border-all",
        slug: "border-all-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "mobile-landscape",
        slug: "mobile-landscape-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "mobile-vibration",
        slug: "mobile-vibration-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "rectangle",
        slug: "rectangle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "right-arrow",
        slug: "right-arrow-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "left-arrow",
        slug: "left-arrow-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "up-arrow",
        slug: "up-arrow-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "down-arrow",
        slug: "down-arrow-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "right-top-arrow-circle",
        slug: "right-top-arrow-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "right-down-arrow-circle",
        slug: "right-down-arrow-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "left-top-arrow-circle",
        slug: "left-top-arrow-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "left-down-arrow-circle",
        slug: "left-down-arrow-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "institution",
        slug: "institution-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "school",
        slug: "school-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chalkboard",
        slug: "chalkboard-solid",
        type_of_icon: "SOLID",
        term: ["whiteboard", "teaching"]
    },
    {
        name: "skip-previous-circle",
        slug: "skip-previous-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "skip-next-circle",
        slug: "skip-next-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "data",
        slug: "data-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "mobile",
        slug: "mobile-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "folder-minus",
        slug: "folder-minus-solid",
        type_of_icon: "SOLID",
        term: ["remove", "delete"]
    },
    {
        name: "bell-plus",
        slug: "bell-plus-solid",
        type_of_icon: "SOLID",
        term: ["alert", "notification"]
    },
    {
        name: "bell-minus",
        slug: "bell-minus-solid",
        type_of_icon: "SOLID",
        term: ["alert", "notification"]
    },
    {
        name: "search",
        slug: "search-solid",
        type_of_icon: "SOLID",
        term: ["magnifying glass"]
    },
    {
        name: "zoom-in",
        slug: "zoom-in-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "zoom-out",
        slug: "zoom-out-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "grid",
        slug: "grid-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-x",
        slug: "user-x-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-check",
        slug: "user-check-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "compass",
        slug: "compass-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "gas-pump",
        slug: "gas-pump-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "stopwatch",
        slug: "stopwatch-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "timer",
        slug: "timer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "time",
        slug: "time-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pie-chart-alt-2",
        slug: "pie-chart-alt-2-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pie-chart-alt-2",
        slug: "pie-chart-alt-2-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "time-five",
        slug: "time-five-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "time-five",
        slug: "time-five-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "instagram-alt",
        slug: "instagram-alt-logo",
        type_of_icon: "LOGO",
        term: ["social media"]
    },
    {
        name: "bookmarks",
        slug: "bookmarks-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bookmark-minus",
        slug: "bookmark-minus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "briefcase-alt-2",
        slug: "briefcase-alt-2-regular",
        type_of_icon: "REGULAR",
        term: ["work", "travel", "suitcase"]
    },
    {
        name: "briefcase-alt-2",
        slug: "briefcase-alt-2-solid",
        type_of_icon: "SOLID",
        term: ["work", "travel", "suitcase"]
    },
    {
        name: "brush-alt",
        slug: "brush-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar",
        slug: "calendar-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-alt",
        slug: "calendar-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-plus",
        slug: "calendar-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-minus",
        slug: "calendar-minus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-x",
        slug: "calendar-x-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-check",
        slug: "calendar-check-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-event",
        slug: "calendar-event-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "customize",
        slug: "customize-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "customize",
        slug: "customize-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "carousel",
        slug: "carousel-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "rewind-circle",
        slug: "rewind-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "fast-forward-circle",
        slug: "fast-forward-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "mobile-vibration",
        slug: "mobile-vibration-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "quote-alt-left",
        slug: "quote-alt-left-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "quote-alt-right",
        slug: "quote-alt-right-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "layout",
        slug: "layout-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "radio",
        slug: "radio-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "printer",
        slug: "printer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sort-a-z",
        slug: "sort-a-z-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sort-z-a",
        slug: "sort-z-a-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "conversation",
        slug: "conversation-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "discussion"]
    },
    {
        name: "brush-alt",
        slug: "brush-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "exit",
        slug: "exit-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "exit",
        slug: "exit-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "extension",
        slug: "extension-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "extension",
        slug: "extension-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-find",
        slug: "file-find-solid",
        type_of_icon: "SOLID",
        term: ["search"]
    },
    {
        name: "face",
        slug: "face-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "face",
        slug: "face-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-find",
        slug: "file-find-regular",
        type_of_icon: "REGULAR",
        term: ["search"]
    },
    {
        name: "label",
        slug: "label-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "label",
        slug: "label-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "check-shield",
        slug: "check-shield-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "check-shield",
        slug: "check-shield-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "border-radius",
        slug: "border-radius-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "add-to-queue",
        slug: "add-to-queue-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "add-to-queue",
        slug: "add-to-queue-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "archive-in",
        slug: "archive-in-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "archive-in",
        slug: "archive-in-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "archive-out",
        slug: "archive-out-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "archive-out",
        slug: "archive-out-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "alarm-add",
        slug: "alarm-add-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "alarm-add",
        slug: "alarm-add-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "space-bar",
        slug: "space-bar-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "image-alt",
        slug: "image-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "image-add",
        slug: "image-add-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "image-add",
        slug: "image-add-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "fridge",
        slug: "fridge-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "fridge",
        slug: "fridge-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dish",
        slug: "dish-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dish",
        slug: "dish-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "spa",
        slug: "spa-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "spa",
        slug: "spa-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cake",
        slug: "cake-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cake",
        slug: "cake-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "city",
        slug: "city-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bolt-circle",
        slug: "bolt-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bolt-circle",
        slug: "bolt-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "tone",
        slug: "tone-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bitcoin",
        slug: "bitcoin-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "lira",
        slug: "lira-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "ruble",
        slug: "ruble-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-up-circle",
        slug: "caret-up-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "caret-down-circle",
        slug: "caret-down-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "caret-left-circle",
        slug: "caret-left-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "caret-right-circle",
        slug: "caret-right-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "rupee",
        slug: "rupee-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "euro",
        slug: "euro-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pound",
        slug: "pound-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "won",
        slug: "won-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "yen",
        slug: "yen-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shekel",
        slug: "shekel-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "facebook-circle",
        slug: "facebook-circle-logo",
        type_of_icon: "LOGO",
        term: ["social media"]
    },
    {
        name: "jquery",
        slug: "jquery-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "imdb",
        slug: "imdb-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "pinterest-alt",
        slug: "pinterest-alt-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "tone",
        slug: "tone-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "health",
        slug: "health-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "baby-carriage",
        slug: "baby-carriage-solid",
        type_of_icon: "SOLID",
        term: ["child", "pregnancy", "birth"]
    },
    {
        name: "clinic",
        slug: "clinic-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "hand-up",
        slug: "hand-up-solid",
        type_of_icon: "SOLID",
        term: ["finger", "point", "direction"]
    },
    {
        name: "hand-right",
        slug: "hand-right-solid",
        type_of_icon: "SOLID",
        term: ["finger", "point", "direction"]
    },
    {
        name: "hand-down",
        slug: "hand-down-solid",
        type_of_icon: "SOLID",
        term: ["finger", "point", "direction"]
    },
    {
        name: "hand-left",
        slug: "hand-left-solid",
        type_of_icon: "SOLID",
        term: ["finger", "point", "direction"]
    },
    {
        name: "male",
        slug: "male-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "female",
        slug: "female-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "male-sign",
        slug: "male-sign-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "female-sign",
        slug: "female-sign-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "clinic",
        slug: "clinic-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "offer",
        slug: "offer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "food-tag",
        slug: "food-tag-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "food-menu",
        slug: "food-menu-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "food-menu",
        slug: "food-menu-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "camera-plus",
        slug: "camera-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "business",
        slug: "business-solid",
        type_of_icon: "SOLID",
        term: ["skyline", "skyscraper", "city"]
    },
    {
        name: "meh-alt",
        slug: "meh-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "wink-tongue",
        slug: "wink-tongue-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "happy-alt",
        slug: "happy-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cool",
        slug: "cool-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "tired",
        slug: "tired-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "smile",
        slug: "smile-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "angry",
        slug: "angry-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "happy-heart-eyes",
        slug: "happy-heart-eyes-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dizzy",
        slug: "dizzy-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "wink-smile",
        slug: "wink-smile-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "confused",
        slug: "confused-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sleepy",
        slug: "sleepy-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shocked",
        slug: "shocked-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "happy-beaming",
        slug: "happy-beaming-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "meh-blank",
        slug: "meh-blank-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "laugh",
        slug: "laugh-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "upside-down",
        slug: "upside-down-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "angry",
        slug: "angry-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "happy-heart-eyes",
        slug: "happy-heart-eyes-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dizzy",
        slug: "dizzy-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "wink-smile",
        slug: "wink-smile-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "smile",
        slug: "smile-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "meh",
        slug: "meh-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "meh-alt",
        slug: "meh-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "confused",
        slug: "confused-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "sleepy",
        slug: "sleepy-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "sad",
        slug: "sad-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "happy",
        slug: "happy-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shocked",
        slug: "shocked-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "happy-beaming",
        slug: "happy-beaming-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "tired",
        slug: "tired-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cool",
        slug: "cool-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "meh-blank",
        slug: "meh-blank-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "laugh",
        slug: "laugh-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "happy-alt",
        slug: "happy-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "upside-down",
        slug: "upside-down-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "wink-tongue",
        slug: "wink-tongue-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "adobe",
        slug: "adobe-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "algolia",
        slug: "algolia-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "audible",
        slug: "audible-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "figma",
        slug: "figma-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "etsy",
        slug: "etsy-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "gitlab",
        slug: "gitlab-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "patreon",
        slug: "patreon-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "redbubble",
        slug: "redbubble-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "diamond",
        slug: "diamond-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "comment-error",
        slug: "comment-error-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "vial",
        slug: "vial-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "align-left",
        slug: "align-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "align-middle",
        slug: "align-middle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "align-right",
        slug: "align-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-back",
        slug: "arrow-back-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bell-minus",
        slug: "bell-minus-regular",
        type_of_icon: "REGULAR",
        term: ["alert", "notification"]
    },
    {
        name: "bell-off",
        slug: "bell-off-regular",
        type_of_icon: "REGULAR",
        term: ["alert", "notification", "silent"]
    },
    {
        name: "bell-plus",
        slug: "bell-plus-regular",
        type_of_icon: "REGULAR",
        term: ["alert", "notification"]
    },
    {
        name: "bell",
        slug: "bell-regular",
        type_of_icon: "REGULAR",
        term: ["alert", "notification"]
    },
    {
        name: "bookmark",
        slug: "bookmark-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bookmarks",
        slug: "bookmarks-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bullseye",
        slug: "bullseye-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "camera-off",
        slug: "camera-off-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "camera",
        slug: "camera-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "captions",
        slug: "captions-regular",
        type_of_icon: "REGULAR",
        term: ["subtitles", "subs", "cc"]
    },
    {
        name: "checkbox-checked",
        slug: "checkbox-checked-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "checkbox",
        slug: "checkbox-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "checkbox-square",
        slug: "checkbox-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-down",
        slug: "chevron-down-regular",
        type_of_icon: "REGULAR",
        term: ["arrow"]
    },
    {
        name: "chevron-up",
        slug: "chevron-up-regular",
        type_of_icon: "REGULAR",
        term: ["arrow"]
    },
    {
        name: "chevron-left",
        slug: "chevron-left-regular",
        type_of_icon: "REGULAR",
        term: ["arrow"]
    },
    {
        name: "chevron-right",
        slug: "chevron-right-regular",
        type_of_icon: "REGULAR",
        term: ["arrow"]
    },
    {
        name: "chevrons-down",
        slug: "chevrons-down-regular",
        type_of_icon: "REGULAR",
        term: ["arrow"]
    },
    {
        name: "chevrons-up",
        slug: "chevrons-up-regular",
        type_of_icon: "REGULAR",
        term: ["arrow"]
    },
    {
        name: "chevrons-right",
        slug: "chevrons-right-regular",
        type_of_icon: "REGULAR",
        term: ["arrow"]
    },
    {
        name: "chevrons-left",
        slug: "chevrons-left-regular",
        type_of_icon: "REGULAR",
        term: ["arrow"]
    },
    {
        name: "clipboard",
        slug: "clipboard-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "code-curly",
        slug: "code-curly-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "code",
        slug: "code-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "coffee",
        slug: "coffee-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "copy",
        slug: "copy-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "copyright",
        slug: "copyright-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "down-arrow-circle",
        slug: "down-arrow-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "error-circle",
        slug: "error-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "error",
        slug: "error-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "exit-fullscreen",
        slug: "exit-fullscreen-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "fast-forward-circle",
        slug: "fast-forward-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "fast-forward",
        slug: "fast-forward-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "first-page",
        slug: "first-page-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "folder-minus",
        slug: "folder-minus-regular",
        type_of_icon: "REGULAR",
        term: ["remove", "delete"]
    },
    {
        name: "folder-plus",
        slug: "folder-plus-regular",
        type_of_icon: "REGULAR",
        term: ["add", "folder add", "new folder"]
    },
    {
        name: "folder",
        slug: "folder-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "fullscreen",
        slug: "fullscreen-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "hide",
        slug: "hide-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "image",
        slug: "image-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "info-circle",
        slug: "info-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "align-justify",
        slug: "align-justify-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "key",
        slug: "key-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "last-page",
        slug: "last-page-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "left-arrow-circle",
        slug: "left-arrow-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "left-down-arrow-circle",
        slug: "left-down-arrow-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "left-indent",
        slug: "left-indent-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "left-top-arrow-circle",
        slug: "left-top-arrow-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "menu",
        slug: "menu-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "microphone",
        slug: "microphone-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "minus-circle",
        slug: "minus-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "moon",
        slug: "moon-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pause-circle",
        slug: "pause-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pause",
        slug: "pause-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "play-circle",
        slug: "play-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "play",
        slug: "play-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "plus-circle",
        slug: "plus-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "question-mark",
        slug: "question-mark-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "radio-circle-marked",
        slug: "radio-circle-marked-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "radio-circle",
        slug: "radio-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "rectangle",
        slug: "rectangle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "rewind",
        slug: "rewind-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "reset",
        slug: "reset-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "right-arrow-circle",
        slug: "right-arrow-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "right-down-arrow-circle",
        slug: "right-down-arrow-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "right-indent",
        slug: "right-indent-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "right-top-arrow-circle",
        slug: "right-top-arrow-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "rss",
        slug: "rss-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "search",
        slug: "search-regular",
        type_of_icon: "REGULAR",
        term: ["magnifying glass"]
    },
    {
        name: "show",
        slug: "show-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "skip-next",
        slug: "skip-next-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "skip-previous",
        slug: "skip-previous-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "stop-circle",
        slug: "stop-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "stop",
        slug: "stop-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "stopwatch",
        slug: "stopwatch-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sync",
        slug: "sync-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "time",
        slug: "time-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "toggle-left",
        slug: "toggle-left-regular",
        type_of_icon: "REGULAR",
        term: ["switch"]
    },
    {
        name: "toggle-right",
        slug: "toggle-right-regular",
        type_of_icon: "REGULAR",
        term: ["switch"]
    },
    {
        name: "trending-down",
        slug: "trending-down-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "trending-up",
        slug: "trending-up-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "up-arrow-circle",
        slug: "up-arrow-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "vertical-center",
        slug: "vertical-center-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "video",
        slug: "video-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "volume-full",
        slug: "volume-full-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "volume-low",
        slug: "volume-low-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "volume-mute",
        slug: "volume-mute-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "volume",
        slug: "volume-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "x-circle",
        slug: "x-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "zoom-in",
        slug: "zoom-in-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "zoom-out",
        slug: "zoom-out-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "archive",
        slug: "archive-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "at",
        slug: "at-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bar-chart-alt",
        slug: "bar-chart-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bar-chart-square",
        slug: "bar-chart-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bar-chart",
        slug: "bar-chart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "basketball",
        slug: "basketball-regular",
        type_of_icon: "REGULAR",
        term: ["nba"]
    },
    {
        name: "block",
        slug: "block-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "book-bookmark",
        slug: "book-bookmark-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "book",
        slug: "book-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bookmark-minus",
        slug: "bookmark-minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bookmark-plus",
        slug: "bookmark-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "briefcase",
        slug: "briefcase-regular",
        type_of_icon: "REGULAR",
        term: ["work", "travel", "suitcase"]
    },
    {
        name: "broadcast",
        slug: "broadcast-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "building",
        slug: "building-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bug",
        slug: "bug-regular",
        type_of_icon: "REGULAR",
        term: ["error", "warning"]
    },
    {
        name: "bluetooth",
        slug: "bluetooth-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bulb",
        slug: "bulb-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "buoy",
        slug: "buoy-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-plus",
        slug: "calendar-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-check",
        slug: "calendar-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-minus",
        slug: "calendar-minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-x",
        slug: "calendar-x-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar",
        slug: "calendar-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chart",
        slug: "chart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cloud-download",
        slug: "cloud-download-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cloud-upload",
        slug: "cloud-upload-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cloud",
        slug: "cloud-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "terminal",
        slug: "terminal-regular",
        type_of_icon: "REGULAR",
        term: ["command line"]
    },
    {
        name: "crosshair",
        slug: "crosshair-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "compass",
        slug: "compass-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "data",
        slug: "data-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "desktop",
        slug: "desktop-regular",
        type_of_icon: "REGULAR",
        term: ["monitor", "display"]
    },
    {
        name: "directions",
        slug: "directions-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dollar",
        slug: "dollar-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dots-horizontal-rounded",
        slug: "dots-horizontal-rounded-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dots-horizontal",
        slug: "dots-horizontal-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dots-vertical-rounded",
        slug: "dots-vertical-rounded-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dots-vertical",
        slug: "dots-vertical-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "download",
        slug: "download-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "envelope",
        slug: "envelope-regular",
        type_of_icon: "REGULAR",
        term: ["letter", "mail", "email", "communication"]
    },
    {
        name: "gift",
        slug: "gift-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "globe",
        slug: "globe-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "devices",
        slug: "devices-regular",
        type_of_icon: "REGULAR",
        term: ["mobile", "tab"]
    },
    {
        name: "headphone",
        slug: "headphone-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "heart",
        slug: "heart-regular",
        type_of_icon: "REGULAR",
        term: ["health"]
    },
    {
        name: "home",
        slug: "home-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "laptop",
        slug: "laptop-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "layer",
        slug: "layer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "link-alt",
        slug: "link-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "link",
        slug: "link-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "list-plus",
        slug: "list-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "list-ul",
        slug: "list-ul-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "list-minus",
        slug: "list-minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "lock-open",
        slug: "lock-open-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "lock",
        slug: "lock-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "map-alt",
        slug: "map-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "map",
        slug: "map-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-rounded",
        slug: "message-rounded-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message",
        slug: "message-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "mobile-alt",
        slug: "mobile-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "mobile",
        slug: "mobile-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "navigation",
        slug: "navigation-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "phone",
        slug: "phone-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pie-chart",
        slug: "pie-chart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "send",
        slug: "send-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sidebar",
        slug: "sidebar-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sitemap",
        slug: "sitemap-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "spreadsheet",
        slug: "spreadsheet-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "tab",
        slug: "tab-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "tag",
        slug: "tag-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "target-lock",
        slug: "target-lock-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "tennis-ball",
        slug: "tennis-ball-regular",
        type_of_icon: "REGULAR",
        term: ["deuce"]
    },
    {
        name: "alarm",
        slug: "alarm-regular",
        type_of_icon: "REGULAR",
        term: ["alert"]
    },
    {
        name: "upload",
        slug: "upload-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "usb",
        slug: "usb-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "video-off",
        slug: "video-off-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "voicemail",
        slug: "voicemail-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "wifi",
        slug: "wifi-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "window-open",
        slug: "window-open-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "window",
        slug: "window-regular",
        type_of_icon: "REGULAR",
        term: ["browser"]
    },
    {
        name: "windows",
        slug: "windows-regular",
        type_of_icon: "REGULAR",
        term: ["browser"]
    },
    {
        name: "duplicate",
        slug: "duplicate-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "table",
        slug: "table-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "x",
        slug: "x-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "adjust",
        slug: "adjust-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "album",
        slug: "album-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "anchor",
        slug: "anchor-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "award",
        slug: "award-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bold",
        slug: "bold-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calculator",
        slug: "calculator-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cart",
        slug: "cart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "check",
        slug: "check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cloud-drizzle",
        slug: "cloud-drizzle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cloud-light-rain",
        slug: "cloud-light-rain-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cloud-lightning",
        slug: "cloud-lightning-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cloud-rain",
        slug: "cloud-rain-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cloud-snow",
        slug: "cloud-snow-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cog",
        slug: "cog-regular",
        type_of_icon: "REGULAR",
        term: ["gear", "setting"]
    },
    {
        name: "columns",
        slug: "columns-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "credit-card",
        slug: "credit-card-regular",
        type_of_icon: "REGULAR",
        term: ["finance", "money", "debit"]
    },
    {
        name: "crop",
        slug: "crop-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cube",
        slug: "cube-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cut",
        slug: "cut-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "detail",
        slug: "detail-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shield-quarter",
        slug: "shield-quarter-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "edit",
        slug: "edit-regular",
        type_of_icon: "REGULAR",
        term: ["writing", "note", "pencil"]
    },
    {
        name: "file",
        slug: "file-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "filter",
        slug: "filter-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "font",
        slug: "font-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "git-branch",
        slug: "git-branch-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "git-commit",
        slug: "git-commit-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "git-compare",
        slug: "git-compare-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "git-merge",
        slug: "git-merge-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "git-pull-request",
        slug: "git-pull-request-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "git-repo-forked",
        slug: "git-repo-forked-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "group",
        slug: "group-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "hash",
        slug: "hash-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "heading",
        slug: "heading-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "home-alt",
        slug: "home-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "italic",
        slug: "italic-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "joystick",
        slug: "joystick-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "link-external",
        slug: "link-external-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "log-in",
        slug: "log-in-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "log-out",
        slug: "log-out-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "microphone-off",
        slug: "microphone-off-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "minus",
        slug: "minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "mouse",
        slug: "mouse-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "move",
        slug: "move-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "music",
        slug: "music-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "notification",
        slug: "notification-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "package",
        slug: "package-regular",
        type_of_icon: "REGULAR",
        term: ["box", "shipping", "delivery"]
    },
    {
        name: "paragraph",
        slug: "paragraph-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "paste",
        slug: "paste-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pencil",
        slug: "pencil-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pin",
        slug: "pin-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "plus",
        slug: "plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "power-off",
        slug: "power-off-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pulse",
        slug: "pulse-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "save",
        slug: "save-regular",
        type_of_icon: "REGULAR",
        term: ["floppy disk"]
    },
    {
        name: "screenshot",
        slug: "screenshot-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "select-multiple",
        slug: "select-multiple-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "share-alt",
        slug: "share-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "share",
        slug: "share-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shield-alt",
        slug: "shield-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shield",
        slug: "shield-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shopping-bag",
        slug: "shopping-bag-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shuffle",
        slug: "shuffle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sort",
        slug: "sort-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "star",
        slug: "star-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sun",
        slug: "sun-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "text",
        slug: "text-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "trash",
        slug: "trash-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "trophy",
        slug: "trophy-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "underline",
        slug: "underline-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "user-check",
        slug: "user-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "user-circle",
        slug: "user-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "user-minus",
        slug: "user-minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "user-plus",
        slug: "user-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "user-x",
        slug: "user-x-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "user",
        slug: "user-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "barcode",
        slug: "barcode-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "crown",
        slug: "crown-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dislike",
        slug: "dislike-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "down-arrow",
        slug: "down-arrow-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "export",
        slug: "export-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "facebook",
        slug: "facebook-logo",
        type_of_icon: "LOGO",
        term: ["social media"]
    },
    {
        name: "first-aid",
        slug: "first-aid-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "flag",
        slug: "flag-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "github",
        slug: "github-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "google",
        slug: "google-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "history",
        slug: "history-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "instagram",
        slug: "instagram-logo",
        type_of_icon: "LOGO",
        term: ["social media"]
    },
    {
        name: "joystick-alt",
        slug: "joystick-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "left-arrow",
        slug: "left-arrow-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "like",
        slug: "like-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "list-check",
        slug: "list-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "poll",
        slug: "poll-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "radar",
        slug: "radar-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "redo",
        slug: "redo-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "reply-all",
        slug: "reply-all-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "reply",
        slug: "reply-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "repost",
        slug: "repost-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "revision",
        slug: "revision-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "right-arrow",
        slug: "right-arrow-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "subdirectory-left",
        slug: "subdirectory-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "subdirectory-right",
        slug: "subdirectory-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "support",
        slug: "support-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "timer",
        slug: "timer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "twitter",
        slug: "twitter-logo",
        type_of_icon: "LOGO",
        term: ["social media"]
    },
    {
        name: "undo",
        slug: "undo-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "up-arrow",
        slug: "up-arrow-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "youtube",
        slug: "youtube-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "whatsapp",
        slug: "whatsapp-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "tumblr",
        slug: "tumblr-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "phone-call",
        slug: "phone-call-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "behance",
        slug: "behance-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "dribbble",
        slug: "dribbble-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "aperture",
        slug: "aperture-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "film",
        slug: "film-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "folder-open",
        slug: "folder-open-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "task",
        slug: "task-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "server",
        slug: "server-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "battery",
        slug: "battery-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-alt",
        slug: "calendar-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "import",
        slug: "import-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "ruler",
        slug: "ruler-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "horizontal-center",
        slug: "horizontal-center-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "rotate-right",
        slug: "rotate-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "rename",
        slug: "rename-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "collapse",
        slug: "collapse-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "phone-incoming",
        slug: "phone-incoming-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "phone-outgoing",
        slug: "phone-outgoing-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "body",
        slug: "body-regular",
        type_of_icon: "REGULAR",
        term: ["male"]
    },
    {
        name: "cast",
        slug: "cast-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chip",
        slug: "chip-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "skip-next-circle",
        slug: "skip-next-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "skip-previous-circle",
        slug: "skip-previous-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "hdd",
        slug: "hdd-regular",
        type_of_icon: "REGULAR",
        term: ["storage", "hard drive"]
    },
    {
        name: "store",
        slug: "store-regular",
        type_of_icon: "REGULAR",
        term: ["shop", "market"]
    },
    {
        name: "globe-alt",
        slug: "globe-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "vimeo",
        slug: "vimeo-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "upvote",
        slug: "upvote-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "downvote",
        slug: "downvote-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "news",
        slug: "news-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pie-chart-alt",
        slug: "pie-chart-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "images",
        slug: "images-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "purchase-tag",
        slug: "purchase-tag-regular",
        type_of_icon: "REGULAR",
        term: ["price", "cost"]
    },
    {
        name: "pen",
        slug: "pen-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "expand",
        slug: "expand-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "paperclip",
        slug: "paperclip-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "closet",
        slug: "closet-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "tv",
        slug: "tv-regular",
        type_of_icon: "REGULAR",
        term: ["television", "monitor"]
    },
    {
        name: "collection",
        slug: "collection-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "station",
        slug: "station-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "wallet",
        slug: "wallet-regular",
        type_of_icon: "REGULAR",
        term: ["money"]
    },
    {
        name: "briefcase-alt",
        slug: "briefcase-alt-regular",
        type_of_icon: "REGULAR",
        term: ["work", "travel", "suitcase"]
    },
    {
        name: "hourglass",
        slug: "hourglass-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "carousel",
        slug: "carousel-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "infinite",
        slug: "infinite-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "plug",
        slug: "plug-regular",
        type_of_icon: "REGULAR",
        term: ["charging"]
    },
    {
        name: "notification-off",
        slug: "notification-off-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "window-close",
        slug: "window-close-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "command",
        slug: "command-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "grid-alt",
        slug: "grid-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "trash-alt",
        slug: "trash-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chalkboard",
        slug: "chalkboard-regular",
        type_of_icon: "REGULAR",
        term: ["whiteboard", "teaching"]
    },
    {
        name: "loader",
        slug: "loader-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "slider",
        slug: "slider-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "paper-plane",
        slug: "paper-plane-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "selection",
        slug: "selection-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "linkedin",
        slug: "linkedin-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "world",
        slug: "world-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dock-bottom",
        slug: "dock-bottom-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dock-right",
        slug: "dock-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dock-top",
        slug: "dock-top-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dock-left",
        slug: "dock-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "layout",
        slug: "layout-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bitcoin",
        slug: "bitcoin-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "facebook-square",
        slug: "facebook-square-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "alarm-off",
        slug: "alarm-off-regular",
        type_of_icon: "REGULAR",
        term: ["alert", "silent"]
    },
    {
        name: "wrench",
        slug: "wrench-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "loader-circle",
        slug: "loader-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "loader-alt",
        slug: "loader-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "car",
        slug: "car-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cart-alt",
        slug: "cart-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "adjust",
        slug: "adjust-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "alarm",
        slug: "alarm-solid",
        type_of_icon: "SOLID",
        term: ["alert"]
    },
    {
        name: "alarm-off",
        slug: "alarm-off-solid",
        type_of_icon: "SOLID",
        term: ["alert", "silent"]
    },
    {
        name: "album",
        slug: "album-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "archive",
        slug: "archive-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "camera",
        slug: "camera-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "camera-off",
        slug: "camera-off-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "folder",
        slug: "folder-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "folder-plus",
        slug: "folder-plus-solid",
        type_of_icon: "SOLID",
        term: ["add", "folder add", "new folder"]
    },
    {
        name: "award",
        slug: "award-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bar-chart-square",
        slug: "bar-chart-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "barcode",
        slug: "barcode-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "battery",
        slug: "battery-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "battery-charging",
        slug: "battery-charging-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "battery-full",
        slug: "battery-full-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bell",
        slug: "bell-solid",
        type_of_icon: "SOLID",
        term: ["alert", "notification"]
    },
    {
        name: "bell-off",
        slug: "bell-off-solid",
        type_of_icon: "SOLID",
        term: ["alert", "notification", "silent"]
    },
    {
        name: "bolt",
        slug: "bolt-solid",
        type_of_icon: "SOLID",
        term: ["zap"]
    },
    {
        name: "book",
        slug: "book-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "book-bookmark",
        slug: "book-bookmark-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bookmark",
        slug: "bookmark-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bookmark-plus",
        slug: "bookmark-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "book-open",
        slug: "book-open-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bookmark-star",
        slug: "bookmark-star-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "briefcase",
        slug: "briefcase-solid",
        type_of_icon: "SOLID",
        term: ["work", "travel", "suitcase"]
    },
    {
        name: "briefcase-alt",
        slug: "briefcase-alt-solid",
        type_of_icon: "SOLID",
        term: ["work", "travel", "suitcase"]
    },
    {
        name: "bug",
        slug: "bug-solid",
        type_of_icon: "SOLID",
        term: ["error", "warning"]
    },
    {
        name: "building",
        slug: "building-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bulb",
        slug: "bulb-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "buoy",
        slug: "buoy-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calculator",
        slug: "calculator-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "captions",
        slug: "captions-solid",
        type_of_icon: "SOLID",
        term: ["subtitles", "subs", "cc"]
    },
    {
        name: "car",
        slug: "car-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cart-alt",
        slug: "cart-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cart",
        slug: "cart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chart",
        slug: "chart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chip",
        slug: "chip-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cloud-download",
        slug: "cloud-download-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cloud-upload",
        slug: "cloud-upload-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cloud",
        slug: "cloud-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "coffee",
        slug: "coffee-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cog",
        slug: "cog-solid",
        type_of_icon: "SOLID",
        term: ["gear", "setting"]
    },
    {
        name: "collection",
        slug: "collection-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "contact",
        slug: "contact-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "copy",
        slug: "copy-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "coupon",
        slug: "coupon-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "crown",
        slug: "crown-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cube",
        slug: "cube-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "detail",
        slug: "detail-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "discount",
        slug: "discount-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dislike",
        slug: "dislike-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dock-bottom",
        slug: "dock-bottom-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dock-left",
        slug: "dock-left-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dock-right",
        slug: "dock-right-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dock-top",
        slug: "dock-top-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "down-arrow-circle",
        slug: "down-arrow-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "download",
        slug: "download-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "downvote",
        slug: "downvote-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "drink",
        slug: "drink-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "droplet",
        slug: "droplet-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "duplicate",
        slug: "duplicate-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "eject",
        slug: "eject-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "envelope",
        slug: "envelope-solid",
        type_of_icon: "SOLID",
        term: ["letter", "mail", "email", "communication"]
    },
    {
        name: "error-circle",
        slug: "error-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "error",
        slug: "error-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-image",
        slug: "file-image-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file",
        slug: "file-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "filter-alt",
        slug: "filter-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "first-aid",
        slug: "first-aid-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "flag-alt",
        slug: "flag-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "flag",
        slug: "flag-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "gift",
        slug: "gift-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "grid-alt",
        slug: "grid-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "group",
        slug: "group-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "hdd",
        slug: "hdd-solid",
        type_of_icon: "SOLID",
        term: ["storage", "hard drive"]
    },
    {
        name: "heart",
        slug: "heart-solid",
        type_of_icon: "SOLID",
        term: ["health"]
    },
    {
        name: "hide",
        slug: "hide-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "home",
        slug: "home-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "hot",
        slug: "hot-solid",
        type_of_icon: "SOLID",
        term: ["fire"]
    },
    {
        name: "hourglass",
        slug: "hourglass-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "image",
        slug: "image-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "inbox",
        slug: "inbox-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "info-circle",
        slug: "info-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "joystick-alt",
        slug: "joystick-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "joystick",
        slug: "joystick-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "layer",
        slug: "layer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "left-arrow-circle",
        slug: "left-arrow-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "like",
        slug: "like-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "lock-open",
        slug: "lock-open-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "lock",
        slug: "lock-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "map-alt",
        slug: "map-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "map",
        slug: "map-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-rounded",
        slug: "message-rounded-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message",
        slug: "message-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "microphone-off",
        slug: "microphone-off-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "microphone",
        slug: "microphone-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "minus-circle",
        slug: "minus-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "moon",
        slug: "moon-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "mouse",
        slug: "mouse-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "music",
        slug: "music-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "navigation",
        slug: "navigation-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "news",
        slug: "news-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "package",
        slug: "package-solid",
        type_of_icon: "SOLID",
        term: ["box", "shipping", "delivery"]
    },
    {
        name: "paper-plane",
        slug: "paper-plane-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "paste",
        slug: "paste-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pen",
        slug: "pen-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pencil",
        slug: "pencil-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "phone-call",
        slug: "phone-call-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "phone-incoming",
        slug: "phone-incoming-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "phone-outgoing",
        slug: "phone-outgoing-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "phone",
        slug: "phone-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pie-chart-alt",
        slug: "pie-chart-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pie-chart",
        slug: "pie-chart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pin",
        slug: "pin-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "playlist",
        slug: "playlist-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "plug",
        slug: "plug-solid",
        type_of_icon: "SOLID",
        term: ["charging"]
    },
    {
        name: "plus-circle",
        slug: "plus-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "printer",
        slug: "printer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "purchase-tag",
        slug: "purchase-tag-solid",
        type_of_icon: "SOLID",
        term: ["price", "cost"]
    },
    {
        name: "quote-left",
        slug: "quote-left-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "quote-right",
        slug: "quote-right-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "radio",
        slug: "radio-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "rename",
        slug: "rename-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "report",
        slug: "report-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "right-arrow-circle",
        slug: "right-arrow-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "ruler",
        slug: "ruler-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "save",
        slug: "save-solid",
        type_of_icon: "SOLID",
        term: ["floppy disk"]
    },
    {
        name: "sort-alt",
        slug: "sort-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "select-multiple",
        slug: "select-multiple-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "send",
        slug: "send-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "server",
        slug: "server-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "share-alt",
        slug: "share-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "share",
        slug: "share-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shield",
        slug: "shield-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shopping-bag-alt",
        slug: "shopping-bag-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shopping-bag",
        slug: "shopping-bag-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "show",
        slug: "show-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "happy",
        slug: "happy-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "meh",
        slug: "meh-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sad",
        slug: "sad-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "spreadsheet",
        slug: "spreadsheet-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "star",
        slug: "star-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "store",
        slug: "store-solid",
        type_of_icon: "SOLID",
        term: ["shop", "market"]
    },
    {
        name: "sun",
        slug: "sun-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "t-shirt",
        slug: "t-shirt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "tag-x",
        slug: "tag-x-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "tag",
        slug: "tag-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "tennis-ball",
        slug: "tennis-ball-solid",
        type_of_icon: "SOLID",
        term: ["deuce"]
    },
    {
        name: "terminal",
        slug: "terminal-solid",
        type_of_icon: "SOLID",
        term: ["command line"]
    },
    {
        name: "to-top",
        slug: "to-top-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "toggle-left",
        slug: "toggle-left-solid",
        type_of_icon: "SOLID",
        term: ["switch"]
    },
    {
        name: "toggle-right",
        slug: "toggle-right-solid",
        type_of_icon: "SOLID",
        term: ["switch"]
    },
    {
        name: "torch",
        slug: "torch-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "trash-alt",
        slug: "trash-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "trash",
        slug: "trash-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "trophy",
        slug: "trophy-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "truck",
        slug: "truck-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "up-arrow-circle",
        slug: "up-arrow-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "upvote",
        slug: "upvote-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-circle",
        slug: "user-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-detail",
        slug: "user-detail-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-minus",
        slug: "user-minus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-plus",
        slug: "user-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user",
        slug: "user-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "video-off",
        slug: "video-off-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "video",
        slug: "video-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "videos",
        slug: "videos-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "volume-full",
        slug: "volume-full-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "volume-low",
        slug: "volume-low-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "volume-mute",
        slug: "volume-mute-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "volume",
        slug: "volume-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "wallet",
        slug: "wallet-solid",
        type_of_icon: "SOLID",
        term: ["money"]
    },
    {
        name: "watch-alt",
        slug: "watch-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "watch",
        slug: "watch-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "widget",
        slug: "widget-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "wrench",
        slug: "wrench-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "x-circle",
        slug: "x-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "zap",
        slug: "zap-solid",
        type_of_icon: "SOLID",
        term: ["bolt"]
    },
    {
        name: "folder-open",
        slug: "folder-open-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "battery-low",
        slug: "battery-low-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "conversation",
        slug: "conversation-solid",
        type_of_icon: "SOLID",
        term: ["chat", "discussion"]
    },
    {
        name: "dashboard",
        slug: "dashboard-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-plus",
        slug: "file-plus-solid",
        type_of_icon: "SOLID",
        term: ["add", "file add", "new file"]
    },
    {
        name: "slider-alt",
        slug: "slider-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "google-plus",
        slug: "google-plus-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "google-plus-circle",
        slug: "google-plus-circle-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "linkedin-square",
        slug: "linkedin-square-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "medium",
        slug: "medium-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "medium-square",
        slug: "medium-square-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "skype",
        slug: "skype-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "slack-old",
        slug: "slack-old-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "slack",
        slug: "slack-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "twitch",
        slug: "twitch-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "discord",
        slug: "discord-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "reddit",
        slug: "reddit-logo",
        type_of_icon: "LOGO",
        term: ["social media"]
    },
    {
        name: "pinterest",
        slug: "pinterest-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "blogger",
        slug: "blogger-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "certification",
        slug: "certification-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "certification",
        slug: "certification-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "rocket",
        slug: "rocket-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "rocket",
        slug: "rocket-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "check-circle",
        slug: "check-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "check-circle",
        slug: "check-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "checkbox",
        slug: "checkbox-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "checkbox-checked",
        slug: "checkbox-checked-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "star-half",
        slug: "star-half-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bus",
        slug: "bus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bus",
        slug: "bus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "check-double",
        slug: "check-double-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dumbbell",
        slug: "dumbbell-regular",
        type_of_icon: "REGULAR",
        term: ["gym", "workout"]
    },
    {
        name: "bot",
        slug: "bot-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "area",
        slug: "area-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bot",
        slug: "bot-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "area",
        slug: "area-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bed",
        slug: "bed-regular",
        type_of_icon: "REGULAR",
        term: ["sleep"]
    },
    {
        name: "bed",
        slug: "bed-solid",
        type_of_icon: "SOLID",
        term: ["sleep"]
    },
    {
        name: "bath",
        slug: "bath-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bath",
        slug: "bath-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "train",
        slug: "train-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "train",
        slug: "train-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "taxi",
        slug: "taxi-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "taxi",
        slug: "taxi-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "movie",
        slug: "movie-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "movie",
        slug: "movie-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "hotel",
        slug: "hotel-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "planet",
        slug: "planet-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "planet",
        slug: "planet-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "list-ol",
        slug: "list-ol-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "video-plus",
        slug: "video-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "video-plus",
        slug: "video-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "menu-alt-left",
        slug: "menu-alt-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "menu-alt-right",
        slug: "menu-alt-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "box",
        slug: "box-regular",
        type_of_icon: "REGULAR",
        term: ["archive"]
    },
    {
        name: "box",
        slug: "box-solid",
        type_of_icon: "SOLID",
        term: ["archive"]
    },
    {
        name: "key",
        slug: "key-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "restaurant",
        slug: "restaurant-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "swim",
        slug: "swim-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "water",
        slug: "water-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "wind",
        slug: "wind-regular",
        type_of_icon: "REGULAR",
        term: ["breeze", "gust", "air"]
    },
    {
        name: "dialpad",
        slug: "dialpad-regular",
        type_of_icon: "REGULAR",
        term: ["keypad"]
    },
    {
        name: "handicap",
        slug: "handicap-regular",
        type_of_icon: "REGULAR",
        term: ["wheelchair", "injury"]
    },
    {
        name: "font-size",
        slug: "font-size-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "code-block",
        slug: "code-block-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "photo-album",
        slug: "photo-album-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "photo-album",
        slug: "photo-album-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bell-ring",
        slug: "bell-ring-solid",
        type_of_icon: "SOLID",
        term: ["alert", "notification"]
    },
    {
        name: "apple",
        slug: "apple-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "android",
        slug: "android-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "play-store",
        slug: "play-store-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "windows",
        slug: "windows-logo",
        type_of_icon: "LOGO",
        term: ["browser"]
    },
    {
        name: "vk",
        slug: "vk-logo",
        type_of_icon: "LOGO",
        term: ["social media"]
    },
    {
        name: "pocket",
        slug: "pocket-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "strikethrough",
        slug: "strikethrough-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "file-blank",
        slug: "file-blank-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "file-blank",
        slug: "file-blank-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "highlight",
        slug: "highlight-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "font-color",
        slug: "font-color-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "fingerprint",
        slug: "fingerprint-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "transfer",
        slug: "transfer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "circle",
        slug: "circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "edit",
        slug: "edit-solid",
        type_of_icon: "SOLID",
        term: ["writing", "note", "pencil"]
    },
    {
        name: "ball",
        slug: "ball-regular",
        type_of_icon: "REGULAR",
        term: ["football", "rugby"]
    },
    {
        name: "ball",
        slug: "ball-solid",
        type_of_icon: "SOLID",
        term: ["football", "rugby"]
    },
    {
        name: "football",
        slug: "football-regular",
        type_of_icon: "REGULAR",
        term: ["soccer", "goal"]
    },
    {
        name: "film",
        slug: "film-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dollar-circle",
        slug: "dollar-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dollar-circle",
        slug: "dollar-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "skull",
        slug: "skull-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "messenger",
        slug: "messenger-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "search-alt",
        slug: "search-alt-regular",
        type_of_icon: "REGULAR",
        term: ["magnifying glass"]
    },
    {
        name: "image-alt",
        slug: "image-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "microphone-alt",
        slug: "microphone-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "analyse",
        slug: "analyse-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "x-square",
        slug: "x-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "plus-square",
        slug: "plus-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "minus-square",
        slug: "minus-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "disc",
        slug: "disc-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "disc",
        slug: "disc-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "equalizer",
        slug: "equalizer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "stats",
        slug: "stats-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "move-horizontal",
        slug: "move-horizontal-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "move-vertical",
        slug: "move-vertical-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "flame",
        slug: "flame-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "grid-horizontal",
        slug: "grid-horizontal-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "grid-vertical",
        slug: "grid-vertical-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "grid-small",
        slug: "grid-small-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "badge",
        slug: "badge-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "badge",
        slug: "badge-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "id-card",
        slug: "id-card-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sort-up",
        slug: "sort-up-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sort-down",
        slug: "sort-down-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "note",
        slug: "note-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "note",
        slug: "note-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "test-tube",
        slug: "test-tube-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "help-circle",
        slug: "help-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "help-circle",
        slug: "help-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "card",
        slug: "card-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "card",
        slug: "card-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "rewind-circle",
        slug: "rewind-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "magnet",
        slug: "magnet-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "magnet",
        slug: "magnet-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "500px",
        slug: "500px-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "angular",
        slug: "angular-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "codepen",
        slug: "codepen-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "creative-commons",
        slug: "creative-commons-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "digitalocean",
        slug: "digitalocean-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "deviantart",
        slug: "deviantart-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "discourse",
        slug: "discourse-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "dropbox",
        slug: "dropbox-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "drupal",
        slug: "drupal-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "ebay",
        slug: "ebay-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "amazon",
        slug: "amazon-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "digg",
        slug: "digg-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "unsplash",
        slug: "unsplash-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "wikipedia",
        slug: "wikipedia-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "sass",
        slug: "sass-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "foursquare",
        slug: "foursquare-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "invision",
        slug: "invision-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "opera",
        slug: "opera-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "airbnb",
        slug: "airbnb-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "yelp",
        slug: "yelp-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "quora",
        slug: "quora-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "git",
        slug: "git-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "html5",
        slug: "html5-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "product-hunt",
        slug: "product-hunt-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "magento",
        slug: "magento-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "stack-overflow",
        slug: "stack-overflow-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "firefox",
        slug: "firefox-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "javascript",
        slug: "javascript-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "nodejs",
        slug: "nodejs-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "kickstarter",
        slug: "kickstarter-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "vuejs",
        slug: "vuejs-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "bing",
        slug: "bing-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "react",
        slug: "react-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "periscope",
        slug: "periscope-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "wordpress",
        slug: "wordpress-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "telegram",
        slug: "telegram-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "stripe",
        slug: "stripe-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "edge",
        slug: "edge-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "paypal",
        slug: "paypal-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "internet-explorer",
        slug: "internet-explorer-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "joomla",
        slug: "joomla-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "dailymotion",
        slug: "dailymotion-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "chrome",
        slug: "chrome-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "baidu",
        slug: "baidu-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "visa",
        slug: "visa-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "mastercard",
        slug: "mastercard-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "redux",
        slug: "redux-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "bootstrap",
        slug: "bootstrap-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "yahoo",
        slug: "yahoo-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "microsoft",
        slug: "microsoft-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "css3",
        slug: "css3-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "jsfiddle",
        slug: "jsfiddle-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "shopify",
        slug: "shopify-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "flickr",
        slug: "flickr-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "less",
        slug: "less-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "snapchat",
        slug: "snapchat-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "soundcloud",
        slug: "soundcloud-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "spotify",
        slug: "spotify-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "trello",
        slug: "trello-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "wix",
        slug: "wix-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "mailchimp",
        slug: "mailchimp-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "medium-old",
        slug: "medium-old-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "squarespace",
        slug: "squarespace-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "whatsapp-square",
        slug: "whatsapp-square-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "flickr-square",
        slug: "flickr-square-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "ambulance",
        slug: "ambulance-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "left-arrow-square",
        slug: "left-arrow-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "up-arrow-square",
        slug: "up-arrow-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "down-arrow-square",
        slug: "down-arrow-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "right-arrow-square",
        slug: "right-arrow-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-badge",
        slug: "user-badge-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-event",
        slug: "calendar-event-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-left",
        slug: "caret-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-up",
        slug: "caret-up-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-right",
        slug: "caret-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-down",
        slug: "caret-down-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "gas-pump",
        slug: "gas-pump-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "landmark",
        slug: "landmark-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "show-alt",
        slug: "show-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "badge-check",
        slug: "badge-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "badge-check",
        slug: "badge-check-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "rotate-left",
        slug: "rotate-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "coffee-alt",
        slug: "coffee-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "brush",
        slug: "brush-regular",
        type_of_icon: "REGULAR",
        term: ["color", "colour", "painting"]
    },
    {
        name: "brush",
        slug: "brush-solid",
        type_of_icon: "SOLID",
        term: ["color", "colour", "painting"]
    },
    {
        name: "keyboard",
        slug: "keyboard-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "megaphone",
        slug: "megaphone-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "directions",
        slug: "directions-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "direction-right",
        slug: "direction-right-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "unlink",
        slug: "unlink-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "paint",
        slug: "paint-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "joystick-button",
        slug: "joystick-button-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "joystick-button",
        slug: "joystick-button-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "font-family",
        slug: "font-family-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "flask",
        slug: "flask-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "capsule",
        slug: "capsule-solid",
        type_of_icon: "SOLID",
        term: ["medicine"]
    },
    {
        name: "color-fill",
        slug: "color-fill-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "hotel",
        slug: "hotel-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "magic-wand",
        slug: "magic-wand-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "repeat",
        slug: "repeat-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "eraser",
        slug: "eraser-solid",
        type_of_icon: "SOLID",
        term: ["rubber"]
    },
    {
        name: "cloud-rain",
        slug: "cloud-rain-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cloud-lightning",
        slug: "cloud-lightning-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "eyedropper",
        slug: "eyedropper-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-rectangle",
        slug: "user-rectangle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "plane",
        slug: "plane-solid",
        type_of_icon: "SOLID",
        term: ["flight", "fly"]
    },
    {
        name: "tree",
        slug: "tree-solid",
        type_of_icon: "SOLID",
        term: ["forest", "christmas"]
    },
    {
        name: "factory",
        slug: "factory-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "ship",
        slug: "ship-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "walk",
        slug: "walk-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "yin-yang",
        slug: "yin-yang-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-pdf",
        slug: "file-pdf-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "money",
        slug: "money-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "home-circle",
        slug: "home-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "home-circle",
        slug: "home-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "location-plus",
        slug: "location-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "location-plus",
        slug: "location-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "arch",
        slug: "arch-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arch",
        slug: "arch-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "atom",
        slug: "atom-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "badge-dollar",
        slug: "badge-dollar-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "baseball",
        slug: "baseball-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "beer",
        slug: "beer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "beer",
        slug: "beer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bible",
        slug: "bible-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bible",
        slug: "bible-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bomb",
        slug: "bomb-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bomb",
        slug: "bomb-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bus-school",
        slug: "bus-school-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bus-school",
        slug: "bus-school-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cabinet",
        slug: "cabinet-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cabinet",
        slug: "cabinet-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-edit",
        slug: "calendar-edit-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-edit",
        slug: "calendar-edit-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "car-wash",
        slug: "car-wash-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "car-garage",
        slug: "car-garage-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "car-mechanic",
        slug: "car-mechanic-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "car-crash",
        slug: "car-crash-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "coffee-togo",
        slug: "coffee-togo-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "coffee-togo",
        slug: "coffee-togo-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chess",
        slug: "chess-solid",
        type_of_icon: "SOLID",
        term: ["strategy"]
    },
    {
        name: "dryer",
        slug: "dryer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "washer",
        slug: "washer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pointer",
        slug: "pointer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "pointer",
        slug: "pointer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "microchip",
        slug: "microchip-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "microchip",
        slug: "microchip-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "piano",
        slug: "piano-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-export",
        slug: "file-export-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "file-import",
        slug: "file-import-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "flag-checkered",
        slug: "flag-checkered-solid",
        type_of_icon: "SOLID",
        term: ["f1", "racing"]
    },
    {
        name: "heart-circle",
        slug: "heart-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "heart-circle",
        slug: "heart-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "heart-square",
        slug: "heart-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "heart-square",
        slug: "heart-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "home-heart",
        slug: "home-heart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "home-heart",
        slug: "home-heart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "info-square",
        slug: "info-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "info-square",
        slug: "info-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "layer-plus",
        slug: "layer-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "layer-plus",
        slug: "layer-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "layer-minus",
        slug: "layer-minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "layer-minus",
        slug: "layer-minus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "recycle",
        slug: "recycle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "traffic-cone",
        slug: "traffic-cone-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "traffic-cone",
        slug: "traffic-cone-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "wifi-2",
        slug: "wifi-2-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "wifi-1",
        slug: "wifi-1-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "wifi-0",
        slug: "wifi-0-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "mask",
        slug: "mask-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "mask",
        slug: "mask-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "low-vision",
        slug: "low-vision-regular",
        type_of_icon: "REGULAR",
        term: ["eye", "view", "visibility"]
    },
    {
        name: "low-vision",
        slug: "low-vision-solid",
        type_of_icon: "SOLID",
        term: ["eye", "view", "visibility"]
    },
    {
        name: "radiation",
        slug: "radiation-solid",
        type_of_icon: "SOLID",
        term: ["hazard", "danger"]
    },
    {
        name: "been-here",
        slug: "been-here-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "been-here",
        slug: "been-here-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "current-location",
        slug: "current-location-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-from-top",
        slug: "arrow-from-top-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-from-top",
        slug: "arrow-from-top-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "arrow-from-bottom",
        slug: "arrow-from-bottom-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-from-bottom",
        slug: "arrow-from-bottom-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "arrow-from-left",
        slug: "arrow-from-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-from-left",
        slug: "arrow-from-left-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "arrow-from-right",
        slug: "arrow-from-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-from-right",
        slug: "arrow-from-right-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "arrow-to-right",
        slug: "arrow-to-right-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-to-right",
        slug: "arrow-to-right-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "arrow-to-left",
        slug: "arrow-to-left-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-to-left",
        slug: "arrow-to-left-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "arrow-to-top",
        slug: "arrow-to-top-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-to-top",
        slug: "arrow-to-top-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "arrow-to-bottom",
        slug: "arrow-to-bottom-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "arrow-to-bottom",
        slug: "arrow-to-bottom-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "book-reader",
        slug: "book-reader-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "book-reader",
        slug: "book-reader-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "edit-location",
        slug: "edit-location-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "ev-station",
        slug: "ev-station-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shapes",
        slug: "shapes-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "florist",
        slug: "florist-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "pizza",
        slug: "pizza-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "scan",
        slug: "scan-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-week",
        slug: "calendar-week-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-week",
        slug: "calendar-week-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "glasses",
        slug: "glasses-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "glasses-alt",
        slug: "glasses-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "border-none",
        slug: "border-none-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "border-inner",
        slug: "border-inner-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "dice-1",
        slug: "dice-1-regular",
        type_of_icon: "REGULAR",
        term: ["game", "random"]
    },
    {
        name: "dice-1",
        slug: "dice-1-solid",
        type_of_icon: "SOLID",
        term: ["game", "random"]
    },
    {
        name: "dice-2",
        slug: "dice-2-regular",
        type_of_icon: "REGULAR",
        term: ["game", "random"]
    },
    {
        name: "dice-2",
        slug: "dice-2-solid",
        type_of_icon: "SOLID",
        term: ["game", "random"]
    },
    {
        name: "dice-3",
        slug: "dice-3-regular",
        type_of_icon: "REGULAR",
        term: ["game", "random"]
    },
    {
        name: "dice-3",
        slug: "dice-3-solid",
        type_of_icon: "SOLID",
        term: ["game", "random"]
    },
    {
        name: "dice-4",
        slug: "dice-4-regular",
        type_of_icon: "REGULAR",
        term: ["game", "random"]
    },
    {
        name: "dice-4",
        slug: "dice-4-solid",
        type_of_icon: "SOLID",
        term: ["game", "random"]
    },
    {
        name: "dice-5",
        slug: "dice-5-regular",
        type_of_icon: "REGULAR",
        term: ["game", "random"]
    },
    {
        name: "dice-5",
        slug: "dice-5-solid",
        type_of_icon: "SOLID",
        term: ["game", "random"]
    },
    {
        name: "dice-6",
        slug: "dice-6-regular",
        type_of_icon: "REGULAR",
        term: ["game", "random"]
    },
    {
        name: "dice-6",
        slug: "dice-6-solid",
        type_of_icon: "SOLID",
        term: ["game", "random"]
    },
    {
        name: "webcam",
        slug: "webcam-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "webcam",
        slug: "webcam-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "spray-can",
        slug: "spray-can-regular",
        type_of_icon: "REGULAR",
        term: ["color", "colour", "paint spray"]
    },
    {
        name: "spray-can",
        slug: "spray-can-solid",
        type_of_icon: "SOLID",
        term: ["color", "colour", "paint spray"]
    },
    {
        name: "file-archive",
        slug: "file-archive-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "sticker",
        slug: "sticker-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "sticker",
        slug: "sticker-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "tachometer",
        slug: "tachometer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "tachometer",
        slug: "tachometer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "thermometer",
        slug: "thermometer-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "game",
        slug: "game-regular",
        type_of_icon: "REGULAR",
        term: ["pacman"]
    },
    {
        name: "game",
        slug: "game-solid",
        type_of_icon: "SOLID",
        term: ["pacman"]
    },
    {
        name: "abacus",
        slug: "abacus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "alarm-snooze",
        slug: "alarm-snooze-regular",
        type_of_icon: "REGULAR",
        term: ["alert", "zzz", "sleep"]
    },
    {
        name: "alarm-snooze",
        slug: "alarm-snooze-solid",
        type_of_icon: "SOLID",
        term: ["alert", "zzz", "sleep"]
    },
    {
        name: "alarm-exclamation",
        slug: "alarm-exclamation-regular",
        type_of_icon: "REGULAR",
        term: ["alert", "error"]
    },
    {
        name: "alarm-exclamation",
        slug: "alarm-exclamation-solid",
        type_of_icon: "SOLID",
        term: ["alert", "error"]
    },
    {
        name: "chevrons-left",
        slug: "chevrons-left-solid",
        type_of_icon: "SOLID",
        term: ["arrow"]
    },
    {
        name: "chevrons-right",
        slug: "chevrons-right-solid",
        type_of_icon: "SOLID",
        term: ["arrow"]
    },
    {
        name: "chevrons-up",
        slug: "chevrons-up-solid",
        type_of_icon: "SOLID",
        term: ["arrow"]
    },
    {
        name: "chevrons-down",
        slug: "chevrons-down-solid",
        type_of_icon: "SOLID",
        term: ["arrow"]
    },
    {
        name: "chevron-down",
        slug: "chevron-down-solid",
        type_of_icon: "SOLID",
        term: ["arrow"]
    },
    {
        name: "chevron-up",
        slug: "chevron-up-solid",
        type_of_icon: "SOLID",
        term: ["arrow"]
    },
    {
        name: "chevron-right",
        slug: "chevron-right-solid",
        type_of_icon: "SOLID",
        term: ["arrow"]
    },
    {
        name: "chevron-left",
        slug: "chevron-left-solid",
        type_of_icon: "SOLID",
        term: ["arrow"]
    },
    {
        name: "guitar-amp",
        slug: "guitar-amp-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "up-arrow-alt",
        slug: "up-arrow-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "down-arrow-alt",
        slug: "down-arrow-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "left-arrow-alt",
        slug: "left-arrow-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "right-arrow-alt",
        slug: "right-arrow-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "medal",
        slug: "medal-regular",
        type_of_icon: "REGULAR",
        term: ["honor", "honour", "achievement"]
    },
    {
        name: "medal",
        slug: "medal-solid",
        type_of_icon: "SOLID",
        term: ["honor", "honour", "achievement"]
    },
    {
        name: "shopping-bags",
        slug: "shopping-bags-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "baseball",
        slug: "baseball-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "task-x",
        slug: "task-x-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "basketball",
        slug: "basketball-solid",
        type_of_icon: "SOLID",
        term: ["nba"]
    },
    {
        name: "barcode-reader",
        slug: "barcode-reader-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "blanket",
        slug: "blanket-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "blanket",
        slug: "blanket-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "binoculars",
        slug: "binoculars-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bone",
        slug: "bone-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bone",
        slug: "bone-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bong",
        slug: "bong-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bong",
        slug: "bong-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "book-alt",
        slug: "book-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "book-alt",
        slug: "book-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "book-heart",
        slug: "book-heart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "book-heart",
        slug: "book-heart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "book-add",
        slug: "book-add-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "book-add",
        slug: "book-add-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bracket",
        slug: "bracket-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "brain",
        slug: "brain-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "brain",
        slug: "brain-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "border-outer",
        slug: "border-outer-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "braille",
        slug: "braille-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "window-alt",
        slug: "window-alt-regular",
        type_of_icon: "REGULAR",
        term: ["browser"]
    },
    {
        name: "window-alt",
        slug: "window-alt-solid",
        type_of_icon: "SOLID",
        term: ["browser"]
    },
    {
        name: "calendar-heart",
        slug: "calendar-heart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-heart",
        slug: "calendar-heart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "wine",
        slug: "wine-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "vial",
        slug: "vial-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "color-fill",
        slug: "color-fill-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "capsule",
        slug: "capsule-regular",
        type_of_icon: "REGULAR",
        term: ["medicine"]
    },
    {
        name: "eraser",
        slug: "eraser-regular",
        type_of_icon: "REGULAR",
        term: ["rubber"]
    },
    {
        name: "drink",
        slug: "drink-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cctv",
        slug: "cctv-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cctv",
        slug: "cctv-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chair",
        slug: "chair-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "network-chart",
        slug: "network-chart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "network-chart",
        slug: "network-chart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "vector",
        slug: "vector-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "vector",
        slug: "vector-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-exclamation",
        slug: "calendar-exclamation-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-exclamation",
        slug: "calendar-exclamation-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "calendar-star",
        slug: "calendar-star-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "calendar-star",
        slug: "calendar-star-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "camera-home",
        slug: "camera-home-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "camera-home",
        slug: "camera-home-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "camera-movie",
        slug: "camera-movie-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "camera-movie",
        slug: "camera-movie-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "backpack",
        slug: "backpack-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cart-download",
        slug: "cart-download-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "cart-add",
        slug: "cart-add-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "car-battery",
        slug: "car-battery-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "caret-right-circle",
        slug: "caret-right-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-left-circle",
        slug: "caret-left-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-up-circle",
        slug: "caret-up-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-down-circle",
        slug: "caret-down-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-right-square",
        slug: "caret-right-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-right-square",
        slug: "caret-right-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "caret-up-square",
        slug: "caret-up-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-up-square",
        slug: "caret-up-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "caret-left-square",
        slug: "caret-left-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-left-square",
        slug: "caret-left-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "caret-down-square",
        slug: "caret-down-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "caret-down-square",
        slug: "caret-down-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shield-x",
        slug: "shield-x-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "shield-x",
        slug: "shield-x-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "line-chart-down",
        slug: "line-chart-down-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-down-circle",
        slug: "chevron-down-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-down-circle",
        slug: "chevron-down-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chevron-up-circle",
        slug: "chevron-up-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-up-circle",
        slug: "chevron-up-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chevron-left-circle",
        slug: "chevron-left-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-left-circle",
        slug: "chevron-left-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chevron-right-circle",
        slug: "chevron-right-circle-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-right-circle",
        slug: "chevron-right-circle-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chevron-down-square",
        slug: "chevron-down-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-down-square",
        slug: "chevron-down-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chevron-up-square",
        slug: "chevron-up-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-up-square",
        slug: "chevron-up-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chevron-left-square",
        slug: "chevron-left-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-left-square",
        slug: "chevron-left-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "chevron-right-square",
        slug: "chevron-right-square-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "chevron-right-square",
        slug: "chevron-right-square-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "church",
        slug: "church-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "church",
        slug: "church-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "coin",
        slug: "coin-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "coin",
        slug: "coin-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "coin-stack",
        slug: "coin-stack-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "coin-stack",
        slug: "coin-stack-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "unite",
        slug: "unite-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "minus-front",
        slug: "minus-front-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "intersect",
        slug: "intersect-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "exclude",
        slug: "exclude-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "minus-back",
        slug: "minus-back-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "merge",
        slug: "merge-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "trim",
        slug: "trim-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "outline",
        slug: "outline-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bullseye",
        slug: "bullseye-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "meteor",
        slug: "meteor-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "meteor",
        slug: "meteor-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "refresh",
        slug: "refresh-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "home-smile",
        slug: "home-smile-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "home-smile",
        slug: "home-smile-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "envelope-open",
        slug: "envelope-open-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "envelope-open",
        slug: "envelope-open-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "dev-to",
        slug: "dev-to-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "message-alt-add",
        slug: "message-alt-add-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "new", "plus"]
    },
    {
        name: "message-alt-add",
        slug: "message-alt-add-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "new", "plus"]
    },
    {
        name: "message-alt-check",
        slug: "message-alt-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-alt-check",
        slug: "message-alt-check-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-alt-error",
        slug: "message-alt-error-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-alt-error",
        slug: "message-alt-error-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-alt-x",
        slug: "message-alt-x-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-alt-x",
        slug: "message-alt-x-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-alt-minus",
        slug: "message-alt-minus-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-alt-minus",
        slug: "message-alt-minus-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-alt-edit",
        slug: "message-alt-edit-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-alt-edit",
        slug: "message-alt-edit-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-alt-detail",
        slug: "message-alt-detail-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-alt-detail",
        slug: "message-alt-detail-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-rounded-check",
        slug: "message-rounded-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-rounded-check",
        slug: "message-rounded-check-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-rounded-error",
        slug: "message-rounded-error-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-rounded-error",
        slug: "message-rounded-error-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-rounded-x",
        slug: "message-rounded-x-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-rounded-x",
        slug: "message-rounded-x-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-rounded-minus",
        slug: "message-rounded-minus-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-rounded-minus",
        slug: "message-rounded-minus-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-rounded-edit",
        slug: "message-rounded-edit-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-rounded-edit",
        slug: "message-rounded-edit-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-rounded-add",
        slug: "message-rounded-add-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "new", "plus"]
    },
    {
        name: "message-rounded-add",
        slug: "message-rounded-add-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "new", "plus"]
    },
    {
        name: "message-rounded-detail",
        slug: "message-rounded-detail-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-rounded-detail",
        slug: "message-rounded-detail-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-check",
        slug: "message-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-check",
        slug: "message-check-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-error",
        slug: "message-error-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-error",
        slug: "message-error-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-x",
        slug: "message-x-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-x",
        slug: "message-x-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-minus",
        slug: "message-minus-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-minus",
        slug: "message-minus-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-edit",
        slug: "message-edit-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-edit",
        slug: "message-edit-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-add",
        slug: "message-add-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "new", "plus"]
    },
    {
        name: "message-add",
        slug: "message-add-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "new", "plus"]
    },
    {
        name: "message-detail",
        slug: "message-detail-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-detail",
        slug: "message-detail-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-square-check",
        slug: "message-square-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-square-check",
        slug: "message-square-check-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-square-error",
        slug: "message-square-error-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-square-error",
        slug: "message-square-error-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-square-x",
        slug: "message-square-x-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-square-x",
        slug: "message-square-x-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-square-minus",
        slug: "message-square-minus-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-square-minus",
        slug: "message-square-minus-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "remove", "delete"]
    },
    {
        name: "message-square-edit",
        slug: "message-square-edit-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-square-edit",
        slug: "message-square-edit-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "message-square-add",
        slug: "message-square-add-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "comment", "new", "plus"]
    },
    {
        name: "message-square-add",
        slug: "message-square-add-solid",
        type_of_icon: "SOLID",
        term: ["chat", "comment", "new", "plus"]
    },
    {
        name: "message-square-detail",
        slug: "message-square-detail-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "message-square-detail",
        slug: "message-square-detail-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "comment-check",
        slug: "comment-check-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "comment-check",
        slug: "comment-check-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "comment-error",
        slug: "comment-error-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "comment-x",
        slug: "comment-x-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "message", "remove", "delete"]
    },
    {
        name: "comment-x",
        slug: "comment-x-solid",
        type_of_icon: "SOLID",
        term: ["chat", "message", "remove", "delete"]
    },
    {
        name: "comment-edit",
        slug: "comment-edit-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "comment-edit",
        slug: "comment-edit-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "comment-minus",
        slug: "comment-minus-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "message", "remove", "delete"]
    },
    {
        name: "comment-minus",
        slug: "comment-minus-solid",
        type_of_icon: "SOLID",
        term: ["chat", "message", "remove", "delete"]
    },
    {
        name: "comment-add",
        slug: "comment-add-regular",
        type_of_icon: "REGULAR",
        term: ["chat", "message", "new", "plus"]
    },
    {
        name: "comment-detail",
        slug: "comment-detail-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "cookie",
        slug: "cookie-regular",
        type_of_icon: "REGULAR",
        term: ["biscuit"]
    },
    {
        name: "cookie",
        slug: "cookie-solid",
        type_of_icon: "SOLID",
        term: ["biscuit"]
    },
    {
        name: "copyright",
        slug: "copyright-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "credit-card-front",
        slug: "credit-card-front-regular",
        type_of_icon: "REGULAR",
        term: ["finance", "money", "debit"]
    },
    {
        name: "credit-card-front",
        slug: "credit-card-front-solid",
        type_of_icon: "SOLID",
        term: ["finance", "money", "debit"]
    },
    {
        name: "crop",
        slug: "crop-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "diamond",
        slug: "diamond-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "door-open",
        slug: "door-open-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "door-open",
        slug: "door-open-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "donate-heart",
        slug: "donate-heart-regular",
        type_of_icon: "REGULAR",
        term: ["donation", "contribution"]
    },
    {
        name: "donate-heart",
        slug: "donate-heart-solid",
        type_of_icon: "SOLID",
        term: ["donation", "contribution"]
    },
    {
        name: "donate-blood",
        slug: "donate-blood-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "donate-blood",
        slug: "donate-blood-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "shape-polygon",
        slug: "shape-polygon-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "zoom",
        slug: "zoom-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "microsoft-teams",
        slug: "microsoft-teams-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "blender",
        slug: "blender-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "kubernetes",
        slug: "kubernetes-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "google-cloud",
        slug: "google-cloud-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "django",
        slug: "django-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "spring-boot",
        slug: "spring-boot-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "tux",
        slug: "tux-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "markdown",
        slug: "markdown-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "python",
        slug: "python-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "ok-ru",
        slug: "ok-ru-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "firebase",
        slug: "firebase-logo",
        type_of_icon: "LOGO"
    },
    {
        name: "c-plus-plus",
        slug: "c-plus-plus-logo",
        type_of_icon: "LOGO",
        term: ["c++"]
    },
    {
        name: "bookmark-heart",
        slug: "bookmark-heart-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bookmark-heart",
        slug: "bookmark-heart-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "sort-alt-2",
        slug: "sort-alt-2-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "category",
        slug: "category-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "category",
        slug: "category-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "category-alt",
        slug: "category-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "category-alt",
        slug: "category-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bookmark-alt",
        slug: "bookmark-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bookmark-alt",
        slug: "bookmark-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bookmark-alt-plus",
        slug: "bookmark-alt-plus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bookmark-alt-plus",
        slug: "bookmark-alt-plus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "bookmark-alt-minus",
        slug: "bookmark-alt-minus-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "bookmark-alt-minus",
        slug: "bookmark-alt-minus-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "face-mask",
        slug: "face-mask-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "tv",
        slug: "tv-solid",
        type_of_icon: "SOLID",
        term: ["television", "monitor"]
    },
    {
        name: "tag-alt",
        slug: "tag-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "tag-alt",
        slug: "tag-alt-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "movie-play",
        slug: "movie-play-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "movie-play",
        slug: "movie-play-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "user-account",
        slug: "user-account-solid",
        type_of_icon: "SOLID"
    },
    {
        name: "expand-alt",
        slug: "expand-alt-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "library",
        slug: "library-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "trip",
        slug: "trip-regular",
        type_of_icon: "REGULAR"
    },
    {
        name: "virus",
        slug: "virus-solid",
        type_of_icon: "SOLID",
        term: ["disease", "covid", "corona"]
    },
    {
        name: "virus-block",
        slug: "virus-block-solid",
        type_of_icon: "SOLID"
    }
];

function getIconClass(icon: Icon) {
    if (icon.type_of_icon === "LOGO") {
        return `bx bxl-${icon.name}`;
    } else if (icon.type_of_icon === "SOLID") {
        return `bx bxs-${icon.name}`;
    }
    return `bx bx-${icon.name}`;
}

for (const icon of icons) {
    icon.className = getIconClass(icon);
}

export default {
    icons
};
