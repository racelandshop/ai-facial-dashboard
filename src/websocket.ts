import { HomeAssistant } from "../frontend-release/src/types";

export const getFaceList = async (hass: HomeAssistant): Promise<any> => {
  const response = await hass.connection.sendMessagePromise<any>({
    type: "raceland_ai_dashboard/get_face_list",
  });
  return response;
};

export const deleteFaceInformation = async (hass: HomeAssistant, name): Promise<any> => {
  const response = await hass.connection.sendMessagePromise<any>({
    type: "raceland_ai_dashboard/delete_face",
    name: name,
  });
  return response;
};

export const teachFaceInformation = async (
  hass: HomeAssistant,
  name: string,
  url: string[]
): Promise<any> => {
  const response = await hass.connection.sendMessagePromise<any>({
    type: "raceland_ai_dashboard/teach_face",
    name: name,
    url: url,
  });
  return response;
};
