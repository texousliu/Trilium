import { ComponentChildren, VNode } from "preact";
import { t } from "../../services/i18n";
import Button from "../react/Button";
import { TabContext } from "./ribbon-interface";
import Dropdown from "../react/Dropdown";
import ActionButton from "../react/ActionButton";
import FormTextArea from "../react/FormTextArea";
import { AttributeType, SaveSearchNoteResponse } from "@triliumnext/commons";
import attributes, { removeOwnedAttributesByNameOrType } from "../../services/attributes";
import FNote from "../../entities/fnote";
import toast from "../../services/toast";
import froca from "../../services/froca";
import { useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ParentComponent } from "../react/react_utils";
import { useNoteLabel, useNoteRelation, useSpacedUpdate, useTooltip, useTriliumEventBeta } from "../react/hooks";
import appContext from "../../components/app_context";
import server from "../../services/server";
import ws from "../../services/ws";
import tree from "../../services/tree";
import NoteAutocomplete from "../react/NoteAutocomplete";
import FormSelect from "../react/FormSelect";
import Icon from "../react/Icon";

interface SearchOption {
  attributeName: string;
  attributeType: "label" | "relation";
  icon: string;
  label: string;
  tooltip?: string;
  // TODO: Make mandatory once all components are ported.
  component?: (props: SearchOptionProps) => VNode;
  additionalAttributesToDelete?: { type: "label" | "relation", name: string }[];
}

interface SearchOptionProps {
  note: FNote;
  refreshResults: () => void;
  attributeName: string;
  attributeType: "label" | "relation";
  additionalAttributesToDelete?: { type: "label" | "relation", name: string }[];
  error?: { message: string };
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
    label: t("search_definition.search_script"),
    component: SearchScriptOption
  },
  {
    attributeName: "ancestor",
    attributeType: "relation",
    icon: "bx bx-filter-alt",
    label: t("search_definition.ancestor"),
    component: AncestorOption,
    additionalAttributesToDelete: [ { type: "label", name: "ancestorDepth" } ]
  },
  {
    attributeName: "fastSearch",
    attributeType: "label",
    icon: "bx bx-run",
    label: t("search_definition.fast_search"),
    tooltip: t("search_definition.fast_search_description"),
    component: FastSearchOption
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
    tooltip: t("search_definition.debug_description"),
    component: DebugOption
  }
];

export default function SearchDefinitionTab({ note, ntxId }: TabContext) {
  const parentComponent = useContext(ParentComponent);
  const [ searchOptions, setSearchOptions ] = useState<{ availableOptions: SearchOption[], activeOptions: SearchOption[] }>();
  const [ error, setError ] = useState<{ message: string }>();

  function refreshOptions() {
    if (!note) return;

    const availableOptions: SearchOption[] = [];
    const activeOptions: SearchOption[] = [];

    for (const searchOption of SEARCH_OPTIONS) {
      const attr = note.getAttribute(searchOption.attributeType, searchOption.attributeName);      
      if (attr && searchOption.component) {
        activeOptions.push(searchOption);
      } else {
        availableOptions.push(searchOption);
      }
    }

    setSearchOptions({ availableOptions, activeOptions });
  }

  async function refreshResults() {
    const noteId = note?.noteId;
    if (!noteId) {
        return;
    }

    try {
        const result = await froca.loadSearchNote(noteId);
        if (result?.error) {
          setError({ message: result?.error})
        } else {
          setError(undefined);
        }
    } catch (e: any) {
        toast.showError(e.message);
    }

    parentComponent?.triggerEvent("searchRefreshed", { ntxId });
  }

  // Refresh the list of available and active options.
  useEffect(refreshOptions, [ note ]);
  useTriliumEventBeta("entitiesReloaded", ({ loadResults }) => {
    if (loadResults.getAttributeRows().find((attrRow) => attributes.isAffecting(attrRow, note))) {
      refreshOptions();
    }
  });

  return (
    <div className="search-definition-widget">
      <div className="search-settings">
        {note && 
          <table className="search-setting-table">
            <tr>
              <td className="title-column">{t("search_definition.add_search_option")}</td>
              <td colSpan={2} className="add-search-option">
                {searchOptions?.availableOptions.map(({ icon, label, tooltip, attributeName, attributeType }) => (
                  <Button
                    icon={icon}
                    text={label}
                    title={tooltip}
                    onClick={() => {
                      const defaultValue = (attributeType === "relation" ? "root" : "");
                      attributes.setAttribute(note, attributeType, attributeName, defaultValue);
                    }}
                  />
                ))}
              </td>
            </tr>
            <tbody className="search-options">
              {searchOptions?.activeOptions.map(({ attributeType, attributeName, component, additionalAttributesToDelete }) => {
                return component?.({
                  attributeName,
                  attributeType,
                  note,
                  refreshResults,
                  error,
                  additionalAttributesToDelete
                });
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

                    <Button
                      icon="bx bxs-zap"
                      text={t("search_definition.search_execute")}
                      onClick={async () => {
                        await server.post(`search-and-execute-note/${note.noteId}`);
                        refreshResults();
                        toast.showMessage(t("search_definition.actions_executed"), 3000);                        
                      }}
                    />

                    {note.isHiddenCompletely() && <Button
                      icon="bx bx-save"
                      text={t("search_definition.save_to_note")}
                      onClick={async () => {
                        const { notePath } = await server.post<SaveSearchNoteResponse>("special-notes/save-search-note", { searchNoteId: note.noteId });
                        if (!notePath) {
                          return;
                        }

                        await ws.waitForMaxKnownEntityChangeId();
                        await appContext.tabManager.getActiveContext()?.setNote(notePath);

                        // Note the {{- notePathTitle}} in json file is not typo, it's unescaping
                        // See https://www.i18next.com/translation-function/interpolation#unescape
                        toast.showMessage(t("search_definition.search_note_saved", { notePathTitle: await tree.getNotePathTitle(notePath) }));
                      }}
                    />}
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

function SearchOption({ note, title, titleIcon, children, help, attributeName, attributeType, additionalAttributesToDelete }: {
  note: FNote;
  title: string,
  titleIcon: string,
  children?: ComponentChildren,
  help: ComponentChildren,
  attributeName: string,
  attributeType: AttributeType,
  additionalAttributesToDelete: { type: "label" | "relation", name: string }[]
}) {
  return (
    <tr>
      <td className="title-column">
        {titleIcon && <><Icon icon={titleIcon} />{" "}</>}
        {title}
      </td>
      <td>{children}</td>
      <td className="button-column">
        {help && <Dropdown buttonClassName="bx bx-help-circle icon-action" hideToggleArrow>{help}</Dropdown>}
        <ActionButton
          icon="bx bx-x"
          className="search-option-del"
          onClick={() => {
            removeOwnedAttributesByNameOrType(note, attributeType, attributeName);
            if (additionalAttributesToDelete) {
              for (const { type, name } of additionalAttributesToDelete) {
                removeOwnedAttributesByNameOrType(note, type, name);
              }
            }
          }}
        />
      </td>
    </tr>
  )
}

function SearchStringOption({ note, refreshResults, error, ...restProps }: SearchOptionProps) {
  const [ searchString, setSearchString ] = useNoteLabel(note, "searchString");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentValue = useRef(searchString ?? "");
  const spacedUpdate = useSpacedUpdate(async () => {
    const searchString = currentValue.current;
    appContext.lastSearchString = searchString;
    setSearchString(searchString);

    if (note.title.startsWith(t("search_string.search_prefix"))) {
      await server.put(`notes/${note.noteId}/title`, {
        title: `${t("search_string.search_prefix")} ${searchString.length < 30 ? searchString : `${searchString.substr(0, 30)}…`}`
      });
    }
  }, 1000);

  // React to errors
  const { showTooltip, hideTooltip } = useTooltip(inputRef, {
    trigger: "manual",
    title: `${t("search_string.error", { error: error?.message })}`,
    html: true,
    placement: "bottom"
  });

  // Auto-focus.
  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (error) {
      showTooltip();
      setTimeout(() => hideTooltip(), 4000);
    } else {
      hideTooltip();
    }
  }, [ error ]);

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
    note={note} {...restProps}
  >
    <FormTextArea
      inputRef={inputRef}
      className="search-string"
      placeholder={t("search_string.placeholder")}
      currentValue={searchString ?? ""}
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

function SearchScriptOption({ note, ...restProps }: SearchOptionProps) {
  const [ searchScript, setSearchScript ] = useNoteRelation(note, "searchScript");

  return <SearchOption
    title={t("search_script.title")}
    help={<>
      <p>{t("search_script.description1")}</p>
      <p>{t("search_script.description2")}</p>
      <p>{t("search_script.example_title")}</p>
      <pre>{t("search_script.example_code")}</pre>
      {t("search_script.note")}
    </>}
    note={note} {...restProps}
  >
    <NoteAutocomplete
      noteId={searchScript !== "root" ? searchScript ?? undefined : undefined}
      noteIdChanged={noteId => setSearchScript(noteId ?? "root")}
      placeholder={t("search_script.placeholder")}
    />
  </SearchOption>
}

function AncestorOption({ note, ...restProps}: SearchOptionProps) {
  const [ ancestor, setAncestor ] = useNoteRelation(note, "ancestor");
  const [ depth, setDepth ] = useNoteLabel(note, "ancestorDepth");

  const options = useMemo(() => {
    const options: { value: string | undefined; label: string }[] = [
      { value: "", label: t("ancestor.depth_doesnt_matter") },
      { value: "eq1", label: `${t("ancestor.depth_eq", { count: 1 })} (${t("ancestor.direct_children")})` }
    ];    

    for (let i=2; i<=9; i++) options.push({ value: "eq" + i, label: t("ancestor.depth_eq", { count: i }) });
    for (let i=0; i<=9; i++) options.push({ value: "gt" + i, label: t("ancestor.depth_gt", { count: i }) });
    for (let i=2; i<=9; i++) options.push({ value: "lt" + i, label: t("ancestor.depth_lt", { count: i }) });

    return options;
  }, []);

  return <SearchOption
    title={t("ancestor.label")}    
    note={note} {...restProps}
  >
    <div style={{display: "flex", alignItems: "center"}}>
      <NoteAutocomplete
        noteId={ancestor !== "root" ? ancestor ?? undefined : undefined}
        noteIdChanged={noteId => setAncestor(noteId ?? "root")}
        placeholder={t("ancestor.placeholder")}
      />

      <div style="margin-left: 10px; margin-right: 10px">{t("ancestor.depth_label")}:</div>
      <FormSelect
        values={options}
        keyProperty="value" titleProperty="label"
        currentValue={depth ?? ""} onChange={(value) => setDepth(value ? value : null)}
        style={{ flexShrink: 3 }}
      />
    </div>
  </SearchOption>;
}

function FastSearchOption({ ...restProps }: SearchOptionProps) {
  return <SearchOption
    titleIcon="bx bx-run" title={t("fast_search.fast_search")}
    help={t("fast_search.description")}
    {...restProps}
  />
}

function DebugOption({ ...restProps }: SearchOptionProps) {
  return <SearchOption
    titleIcon="bx bx-bug" title={t("debug.debug")}
    help={<>
      <p>{t("debug.debug_info")}</p>
      {t("debug.access_info")}
    </>}
    {...restProps}
  />
}