import { t } from "../../services/i18n";
import Button from "../react/Button";
import { TabContext } from "./ribbon-interface";

interface SearchOption {
  searchOption: string;
  icon: string;
  label: string;
  tooltip?: string;
}

const SEARCH_OPTIONS: SearchOption[] = [
  {
    searchOption: "searchString",
    icon: "bx bx-text",
    label: t("search_definition.search_string")
  },
  {
    searchOption: "searchScript",
    icon: "bx bx-code",
    label: t("search_definition.search_script")
  },
  {
    searchOption: "ancestor",
    icon: "bx bx-filter-alt",
    label: t("search_definition.ancestor")
  },
  {
    searchOption: "fastSearch",
    icon: "bx bx-run",
    label: t("search_definition.fast_search"),
    tooltip: t("search_definition.fast_search_description")
  },
  {
    searchOption: "includeArchivedNotes",
    icon: "bx bx-archive",
    label: t("search_definition.include_archived"),
    tooltip: t("search_definition.include_archived_notes_description")
  },
  {
    searchOption: "orderBy",
    icon: "bx bx-arrow-from-top",
    label: t("search_definition.order_by")
  },
  {
    searchOption: "limit",
    icon: "bx bx-stop",
    label: t("search_definition.limit"),
    tooltip: t("search_definition.limit_description")
  },
  {
    searchOption: "debug",
    icon: "bx bx-bug",
    label: t("search_definition.debug"),
    tooltip: t("search_definition.debug_description")
  }
];

export default function SearchDefinitionTab({ note }: TabContext) {
  return (
    <div className="search-definition-widget">
      <div className="search-settings">
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
        </table>
      </div>
    </div>
  )
}