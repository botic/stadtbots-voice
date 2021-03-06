import {GeoFence} from "../types/stadtkatalog";
import {getEntry, searchFulltext} from "@stadtkatalog/stadtkatalog";
import {EntryData, SortField, SortOrder} from "@stadtkatalog/stadtkatalog/lib/types";
import {Slot} from "ask-sdk-model";
import config from "../config";

const BLACKLIST = config.get("stadtkatalog.blacklist");
const VAGUE_TERMS = config.get("stadtkatalog.vagueTerms").map((term: string) => term.toLocaleLowerCase());

/**
 * Searches the StadtKatalog for the given `shopName` slot.
 * @param slot the shopName slot
 * @param geoFence restricts the search to the given geo fence
 * @see https://docs.stadtkatalog.org/opendata-rest-api/#entry-by-id
 */
export async function shopNameSlotToEntryData(slot: Slot, geoFence: GeoFence): Promise<EntryData|null> {
    if (slot.resolutions) {
        const resolution = slot.resolutions.resolutionsPerAuthority?.find(resolution => {
            return resolution.status.code === "ER_SUCCESS_MATCH" && resolution.values.length === 1;
        });

        if (resolution) {
            const stkEntryId = resolution.values[0]?.value?.id;
            if (stkEntryId) {
                return (await getEntry(stkEntryId))?.data || null;
            }
        }
    }

    if (slot.value !== undefined) {
        if (VAGUE_TERMS.includes(slot.value.toLocaleLowerCase())) {
            // fixme: this should result in a follow-up question for the slot value!
            return null;
        }

        const searchResult = await searchFulltext(
            slot.value,
            SortField.relevance,
            SortOrder.desc,
            5,
            0,
            geoFence
        );

        if (searchResult) {
            const filteredHits = searchResult.hits.filter(hit => !BLACKLIST.includes(hit.id));
            if (filteredHits.length >= 1) {
                return filteredHits[0]?.data || null;
            }
        }

        return null;
    } else {
        return null;
    }
}
