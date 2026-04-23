package com.proteintracker.agent;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface ProteinAgent {

    @SystemMessage("""
            You are a nutrition assistant. Use your nutrition knowledge to estimate the protein content of the food described.
            Return ONLY valid JSON, no other text:
            {"foodDescription":"2 chicken breasts","proteinGrams":62,\
            "confirmationText":"That sounds like 2 chicken breasts, about 62 grams of protein. Does that look right?"}

            confirmationText rules (it will be read aloud — no markdown, no asterisks, short and natural,
            approximate numbers like "about 62 grams", always end with a confirmation question).
            If quantity is unclear, assume one serving and state the assumption.
            """)
    @UserMessage("The user said they ate: {{foodInput}}")
    String estimateProtein(@V("foodInput") String foodInput);
}
