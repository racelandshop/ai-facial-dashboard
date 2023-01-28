import { PersonInfo } from "../types";
import { getFaceList } from "../websocket";

export async function getPersonEntities(hass) {
  const people: PersonInfo[] = [];
  const registeredFacesNames = await getRegisteredFacesNames(hass);
  if (registeredFacesNames == "Deepstack Error") {
    return undefined;
  }
  const states = hass.states;
  for (const [key, value] of Object.entries(states)) {
    if (computeDomain(key) === "person") {
      people.push({
        name: value.attributes.friendly_name,
        entityID: value.entity_id,
        picture: value.attributes.entity_picture,
        id: value.attributes.id,
        user_id: value.attributes.user_id,
        registered_status: registeredFacesNames.includes(value.attributes.friendly_name),
      });
    }
  }
  return people;
}

export async function getRegisteredFacesNames(hass) {
  const faceList = await getFaceList(hass);
  return faceList;
}

export function computeDomain(entity: string): string {
  return entity.split(".")[0];
}
