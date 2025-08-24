import NoteContextAwareWidget from "../note_context_aware_widget.js";
import utils from "../../services/utils.js";
import branchService from "../../services/branches.js";
import dialogService from "../../services/dialog.js";
import server from "../../services/server.js";
import toastService from "../../services/toast.js";
import ws from "../../services/ws.js";
import appContext, { type EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";
import type FNote from "../../entities/fnote.js";
import type { FAttachmentRow } from "../../entities/fattachment.js";

const TPL = /*html*/`
<div class="dropdown note-actions">
    <style>
        .note-actions {
            width: 35px;
            height: 35px;
        }

        .note-actions .dropdown-menu {
            min-width: 15em;
        }

        .note-actions .dropdown-item .bx {
            position: relative;
            top: 3px;
            font-size: 120%;
            margin-right: 5px;
        }

        .note-actions .dropdown-item[disabled], .note-actions .dropdown-item[disabled]:hover {
            color: var(--muted-text-color) !important;
            background-color: transparent !important;
            pointer-events: none; /* makes it unclickable */
        }

    </style>
</div>`;
