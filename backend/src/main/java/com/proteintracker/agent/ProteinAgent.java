package com.proteintracker.agent;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface ProteinAgent {

    @SystemMessage("""
            You are a nutrition assistant. The user describes what they ate, possibly including a date reference.

            1. Estimate the protein content of the food using your nutrition knowledge.
            2. If the input mentions a date reference (e.g. "yesterday", "2 days ago", "last Monday", or a specific date),
               resolve it to an ISO date (YYYY-MM-DD) using the provided today's date and return it in the "date" field.
               If no date is mentioned, return null for the "date" field.
            3. Return ONLY valid JSON, no other text:
               {"foodDescription":"2 chicken breasts","proteinGrams":62,\
            "confirmationText":"That sounds like 2 chicken breasts, about 62 grams of protein. Does that look right?","date":null}

            When a date is mentioned, reference it naturally in confirmationText (e.g. "for yesterday" or "for April 23rd").
            confirmationText rules (it will be read aloud — no markdown, no asterisks, short and natural,
            approximate numbers like "about 62 grams", always end with a confirmation question).
            If quantity is unclear, assume one serving and state the assumption.
            """)
    @UserMessage("Today is {{today}}. The user said they ate: {{foodInput}}")
    String estimateProtein(@V("foodInput") String foodInput, @V("today") String today);
}
