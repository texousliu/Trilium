/**
 * Hierarchy Context Constants
 *
 * This file centralizes all translatable strings used in the note hierarchy context
 * functionality. These strings are used when displaying information about parent-child
 * relationships and note relations in the LLM context building process.
 */

import { t } from 'i18next';

export const HIERARCHY_STRINGS = {
    // Parent context strings
    PARENT_CONTEXT: {
        NO_PARENT_CONTEXT: () => t('llm.hierarchy.no_parent_context', 'No parent context available.'),
        CURRENT_NOTE: (title: string) => t('llm.hierarchy.current_note', '{{title}} (current note)', { title }),
    },

    // Child context strings
    CHILD_CONTEXT: {
        NO_CHILD_NOTES: () => t('llm.hierarchy.no_child_notes', 'No child notes.'),
        CHILD_NOTES_HEADER: (count: number) => t('llm.hierarchy.child_notes_header', 'Child notes ({{count}} total)', { count }),
        CHILD_SUMMARY_PREFIX: () => t('llm.hierarchy.child_summary_prefix', 'Summary: '),
        MORE_CHILDREN: (count: number) => t('llm.hierarchy.more_children', '... and {{count}} more child notes not shown', { count }),
        ERROR_RETRIEVING: () => t('llm.hierarchy.error_retrieving_children', 'Error retrieving child notes.')
    },

    // Linked notes context strings
    LINKED_NOTES: {
        NO_LINKED_NOTES: () => t('llm.hierarchy.no_linked_notes', 'No linked notes.'),
        OUTGOING_RELATIONS_HEADER: (count: number) => t('llm.hierarchy.outgoing_relations_header', 'Outgoing relations ({{count}} total)', { count }),
        INCOMING_RELATIONS_HEADER: (count: number) => t('llm.hierarchy.incoming_relations_header', 'Incoming relations ({{count}} total)', { count }),
        DEFAULT_RELATION: () => t('llm.hierarchy.default_relation', 'relates to'),
        MORE_OUTGOING: (count: number) => t('llm.hierarchy.more_outgoing', '... and {{count}} more outgoing relations not shown', { count }),
        MORE_INCOMING: (count: number) => t('llm.hierarchy.more_incoming', '... and {{count}} more incoming relations not shown', { count }),
        ERROR_RETRIEVING: () => t('llm.hierarchy.error_retrieving_linked', 'Error retrieving linked notes.')
    }
};
