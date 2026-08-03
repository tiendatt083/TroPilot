package com.tropilot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
/** Nội dung câu trả lời đã tạo bởi chatbot. */
public class ChatMessageResponse {

    private String reply;
}
