import { useMemo } from "preact/hooks";
import { t } from "../../services/i18n";
import { ViewTypeOptions } from "../../services/note_list_renderer";
import FormSelect from "../react/FormSelect";
import { TabContext } from "./ribbon-interface";
import { mapToKeyValueArray } from "../../services/utils";
import { useNoteLabel } from "../react/hooks";
import FNote from "../../entities/fnote";
import FormGroup from "../react/FormGroup";

const VIEW_TYPE_MAPPINGS: Record<ViewTypeOptions, string> = {
  grid: t("book_properties.grid"),
  list: t("book_properties.list"),
  calendar: t("book_properties.calendar"),
  table: t("book_properties.table"),
  geoMap: t("book_properties.geo-map"),
  board: t("book_properties.board")
};

export default function CollectionPropertiesTab({ note }: TabContext) {
  return (note &&
    <div className="book-properties-widget">
      <CollectionTypeSwitcher note={note} />

      <div className="book-properties-container">
      </div>
    </div>
  );
}

function CollectionTypeSwitcher({ note }: { note: FNote }) {
  const collectionTypes = useMemo(() => mapToKeyValueArray(VIEW_TYPE_MAPPINGS), []);
  const [ viewType, setViewType ] = useNoteLabel(note, "viewType");

  return (
    <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{ whiteSpace: "nowrap" }}>{t("book_properties.view_type")}:&nbsp; &nbsp;</span>
        <FormSelect
          currentValue={viewType ?? "grid"} onChange={setViewType}
          values={collectionTypes}
          keyProperty="key" titleProperty="value"
        />
    </div>
  )
}