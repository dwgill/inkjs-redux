import { Story } from "inkjs";
import { action } from "./actions";
import { ExternalStoryFunc, StoryConfig } from "./util/types";

export const storyActions = {
  clearStory: action("story/clearStory", () => {}),

  continueStory: action("story/continueStory", (maximally?: boolean) => ({
    maximally: maximally as boolean | null | undefined,
  })),
  setStory: action(
    "story/setStory",
    (story: string | InstanceType<typeof Story>, config: StoryConfig) => {
      if (typeof story === "string") {
        story = new Story(story);
      }
      return {
        story,
        config,
      };
    }
  ),
  bindExternalFunction: action(
    "story/bindExternalFunction",
    (options: {
      name: string;
      func: ExternalStoryFunc;
      lookaheadSafe?: boolean;
    }) => options
  ),
  chooseChoice: action(
    "story/chooseChoice",
    (options: ChooseChoiceOptions) => options
  ),
};

type ChooseChoiceOptions = ({ id: string } | { index: number }) & {
  continueAfter?: boolean | "max";
};
