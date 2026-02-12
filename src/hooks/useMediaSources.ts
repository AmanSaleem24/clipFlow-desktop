import { getMediaResources } from "@/lib/utils";
import { useCallback, useReducer } from "react";

export type SourceDeviceStateProps = {
  displays?: {
    appIcon: null;
    display_id: string;
    id: string;
    name: string;
    thumbnail: string;
  }[];
  audioInputs?: {
    deviceId: string;
    kind: string;
    label: string;
    groupId: string;
  }[];
  error?: string | null;
  isPending: boolean;
};

type DisplayDeviceActionProps = {
  type: "GET_DEVICES";
  payload: SourceDeviceStateProps;
};

export const useMediaSources = () => {
  const [state, action] = useReducer(
    (state: SourceDeviceStateProps, action: DisplayDeviceActionProps) => {
      switch (action.type) {
        case "GET_DEVICES":
          return { ...state, ...action.payload };

        default:
          return state;
      }
    },
    {
      displays: [],
      audioInputs: [],
      error: null,
      isPending: false,
    },
  );

  const fetchMediaResources = useCallback(() => {
    action({ type: "GET_DEVICES", payload: { isPending: true, error: null } });
    getMediaResources()
      .then((sources) =>
        action({
          type: "GET_DEVICES",
          payload: {
            displays: sources.displays,
            audioInputs: sources.audio,
            isPending: false,
            error: null,
          },
        }),
      )
      .catch((error) => {
        console.error("Failed to fetch media resources", error);
        action({
          type: "GET_DEVICES",
          payload: {
            isPending: false,
            error: "Unable to load media sources",
          },
        });
      });
  }, []);

  return {state, fetchMediaResources}
};
