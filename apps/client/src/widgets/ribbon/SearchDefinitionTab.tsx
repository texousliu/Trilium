import { ComponentChildren, VNode } from "preact";
import { t } from "../../services/i18n";
import Button from "../react/Button";
import { TabContext } from "./ribbon-interface";
import Dropdown from "../react/Dropdown";
import ActionButton from "../react/ActionButton";
import FormTextArea from "../react/FormTextArea";
import { AttributeType, OptionNames } from "@triliumnext/commons";
import attributes, { removeOwnedAttributesByNameOrType } from "../../services/attributes";
import { note } from "mermaid/dist/rendering-util/rendering-elements/shapes/note.js";
import FNote from "../../entities/fnote";
import toast from "../../services/toast";
import froca from "../../services/froca";
import { useContext, useRef } from "preact/hooks";
import { ParentComponent } from "../react/react_utils";
import { useSpacedUpdate } from "../react/hooks";
import appContext from "../../components/app_context";
import server from "../../services/server";

interface SearchOption {
  attributeName: string;
  attributeType: "label" | "relation";
  icon: string;
  label: string;
  tooltip?: string;
  // TODO: Make mandatory once all components are ported.
  component?: (props: SearchOptionProps) => VNode;
}

interface SearchOptionProps {
  note: FNote;
  refreshResults: () => void;
  attributeName: string;
  attributeType: "label" | "relation";
}

const SEARCH_OPTIONS: SearchOption[] = [
  {
    attributeName: "searchString",
    attributeType: "label",
    icon: "bx bx-text",
    label: t("search_definition.search_string"),
    component: SearchStringOption
  },
  {
    attributeName: "searchScript",
    attributeType: "relation",
    icon: "bx bx-code",
    label: t("search_definition.search_script")
  },
  {
    attributeName: "ancestor",
    attributeType: "relation",
    icon: "bx bx-filter-alt",
    label: t("search_definition.ancestor")
  },
  {
    attributeName: "fastSearch",
    attributeType: "label",
    icon: "bx bx-run",
    label: t("search_definition.fast_search"),
    tooltip: t("search_definition.fast_search_description")
  },
  {
    attributeName: "includeArchivedNotes",
    attributeType: "label",
    icon: "bx bx-archive",
    label: t("search_definition.include_archived"),
    tooltip: t("search_definition.include_archived_notes_description")
  },
  {
    attributeName: "orderBy",
    attributeType: "label",
    icon: "bx bx-arrow-from-top",
    label: t("search_definition.order_by")
  },
  {
    attributeName: "limit",
    attributeType: "label",
    icon: "bx bx-stop",
    label: t("search_definition.limit"),
    tooltip: t("search_definition.limit_description")
  },
  {
    attributeName: "debug",
    attributeType: "label",
    icon: "bx bx-bug",
    label: t("search_definition.debug"),
    tooltip: t("search_definition.debug_description")
  }
];

export default function SearchDefinitionTab({ note, ntxId }: TabContext) {
  const parentComponent = useContext(ParentComponent);
  

  async function refreshResults() {
    const noteId = note?.noteId;
    if (!noteId) {
        return;
    }

    try {
        const result = await froca.loadSearchNote(noteId);

        if (result && result.error) {
          //this.handleEvent("showSearchError", { error: result.error });
        }
    } catch (e: any) {
        toast.showError(e.message);
    }

    parentComponent?.triggerEvent("searchRefreshed", { ntxId });
  }

  return (
    <div className="search-definition-widget">
      <div className="search-settings">
        {note && 
          <table className="search-setting-table">
            <tr>
              <td className="title-column">{t("search_definition.add_search_option")}</td>
              <td colSpan={2} className="add-search-option">
                {SEARCH_OPTIONS.map(({ icon, label, tooltip }) => (
                  <Button
                    icon={icon}
                    text={label}
                    title={tooltip}
                  />
                ))}
              </td>
            </tr>
            <tbody className="search-options">
              {SEARCH_OPTIONS.map(({ attributeType, attributeName, component }) => {
                const attr = note.getAttribute(attributeType, attributeName);      
                if (attr && component) {
                  return component({
                    attributeName,
                    attributeType,
                    note,
                    refreshResults
                  });
                }  
              })}
            </tbody>
            <tbody className="action-options">

            </tbody>
            <tbody>
              <tr>
                <td colSpan={3}>
                  <div style={{ display: "flex", justifyContent: "space-evenly" }}>
                    <Button
                      icon="bx bx-search"
                      text={t("search_definition.search_button")}
                      keyboardShortcut="Enter"
                      onClick={refreshResults}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        }
      </div>
    </div>
  )
}

function SearchOption({ note, title, children, help, attributeName, attributeType }: {
  note: FNote;
  title: string,
  children: ComponentChildren,
  help: ComponentChildren,
  attributeName: string,
  attributeType: AttributeType
}) {
  return (
    <tr>
      <td className="title-column">{title}</td>
      <td>{children}</td>
      <td className="button-column">
        {help && <Dropdown buttonClassName="bx bx-help-circle icon-action" hideToggleArrow>{help}</Dropdown>}
        <ActionButton
          icon="bx bx-x"
          className="search-option-del"
          onClick={() => removeOwnedAttributesByNameOrType(note, attributeType, attributeName)}
        />
      </td>
    </tr>
  )
}

function SearchStringOption({ note, refreshResults }: SearchOptionProps) {
  const currentValue = useRef("");
  const spacedUpdate = useSpacedUpdate(async () => {
    const searchString = currentValue.current;
    appContext.lastSearchString = searchString;

    await attributes.setAttribute(note, "label", "searchString", searchString);

    if (note.title.startsWith(t("search_string.search_prefix"))) {
      await server.put(`notes/${note.noteId}/title`, {
          title: `${t("search_string.search_prefix")} ${searchString.length < 30 ? searchString : `${searchString.substr(0, 30)}…`}`
      });
    }
  }, 1000);

  return <SearchOption
    title={t("search_string.title_column")}
    help={<>
      <strong>{t("search_string.search_syntax")}</strong> - {t("search_string.also_see")} <a href="#" data-help-page="search.html">{t("search_string.complete_help")}</a>
      <ul style="marigin-bottom: 0;">
          <li>{t("search_string.full_text_search")}</li>
          <li><code>#abc</code> - {t("search_string.label_abc")}</li>
          <li><code>#year = 2019</code> - {t("search_string.label_year")}</li>
          <li><code>#rock #pop</code> - {t("search_string.label_rock_pop")}</li>
          <li><code>#rock or #pop</code> - {t("search_string.label_rock_or_pop")}</li>
          <li><code>#year &lt;= 2000</code> - {t("search_string.label_year_comparison")}</li>
          <li><code>note.dateCreated &gt;= MONTH-1</code> - {t("search_string.label_date_created")}</li>
      </ul>
    </>}
  >
    <FormTextArea
      className="search-string"
      placeholder={t("search_string.placeholder")}
      onChange={text => {
        currentValue.current = text;
        spacedUpdate.scheduleUpdate();
      }}
      onKeyDown={async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();

          // this also in effect disallows new lines in query string.
          // on one hand, this makes sense since search string is a label
          // on the other hand, it could be nice for structuring long search string. It's probably a niche case though.
          await spacedUpdate.updateNowIfNecessary();
          refreshResults();
        }
      }}
    />
  </SearchOption>
}