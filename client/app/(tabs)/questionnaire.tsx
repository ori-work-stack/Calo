import React from "react";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";

export default function TabsQuestionnaireScreen() {
  const { user } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    // Redirect to the main questionnaire screen
    if (user?.is_questionnaire_completed) {
      // If questionnaire is completed, go to edit mode
      router.replace("/questionnaire?mode=edit");
    } else {
      // If not completed, go to regular questionnaire
      router.replace("/questionnaire");
    }
  }, [user]);

  // Return null since we're redirecting immediately
  return null;
}
