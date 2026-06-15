package com.tropilot.integration.gemini;

import com.tropilot.config.GeminiProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeminiChatClientTest {

    @Test
    void generateReplySendsStrictContextPromptAndLargerOutputLimit() {
        GeminiProperties properties = new GeminiProperties();
        properties.setEnabled(true);
        properties.setApiKey("test-gemini-key");
        properties.setModel("gemini-test-model");

        RestClient.Builder builder = RestClient.builder().baseUrl(properties.getBaseUrl());
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        GeminiChatClient client = new GeminiChatClient(properties, builder.build());

        server.expect(requestTo(properties.getBaseUrl()
                        + "/v1beta/models/gemini-test-model:generateContent"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "test-gemini-key"))
                .andExpect(content().string(containsString("\"maxOutputTokens\":1500")))
                .andExpect(content().string(containsString(
                        "Answer direct factual questions from it directly"
                )))
                .andExpect(content().string(containsString(
                        "Use exact numbers, dates, statuses, names, and amounts"
                )))
                .andExpect(content().string(containsString(
                        "Use LIVE_SYSTEM_CONTEXT.businessRules"
                )))
                .andExpect(content().string(containsString(
                        "Respect LIVE_SYSTEM_CONTEXT.user.dataScope and role boundaries"
                )))
                .andExpect(content().string(containsString(
                        "Do not redirect the user to another page"
                )))
                .andExpect(content().string(containsString(
                        "If the context does not contain enough data to answer"
                )))
                .andExpect(content().string(containsString(
                        "Do not infer, invent, or reveal values"
                )))
                .andExpect(content().string(containsString(
                        "Never request or reveal passwords, API keys, JWT tokens"
                )))
                .andExpect(content().string(containsString(
                        "explain the cause behind a result and suggest the next operational action"
                )))
                .andExpect(content().string(containsString(
                        "never return only the total when the related records are"
                )))
                .andExpect(content().string(containsString(
                        "For building questions, list each building by code and"
                )))
                .andExpect(content().string(containsString(
                        "include the related record list required by the count and summary rule"
                )))
                .andExpect(content().string(containsString(
                        "Answer in the same language as the user's latest message"
                )))
                .andRespond(withSuccess("""
                        {
                          "candidates": [
                            {
                              "content": {
                                "parts": [
                                  {
                                    "text": "There are 2 buildings."
                                  }
                                ]
                              }
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        String reply = client.generateReply(
                List.of(),
                "How many buildings are there?",
                "{\"summary\":{\"totalBuildings\":2}}"
        );

        assertThat(reply).isEqualTo("There are 2 buildings.");
        server.verify();
    }
}
