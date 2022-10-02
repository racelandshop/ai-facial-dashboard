import { PersonInfo } from "../types";

export function getPersonEntities(states) {
  const people: PersonInfo[] = [];
  for (const [key, value] of Object.entries(states)) {
    if (computeDomain(key) === "person") {
      people.push({
        name: value.attributes.friendly_name,
        entityID: value.entity_id,
        picture: value.attributes.entity_picture,
        id: value.attributes.id,
        user_id: value.attributes.user_id,
        registered_status: _computeStatus(value.entity_id),
      });
    }
  }
  return people;
}

export function computeDomain(entity: string): string {
  return entity.split(".")[0];
}

export function _computeStatus(entity_id: string): boolean {
  return true; //Default ouput for now
}
