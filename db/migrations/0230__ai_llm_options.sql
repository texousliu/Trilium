-- Add new options for AI/LLM integration
INSERT INTO options (name, value, isSynced) VALUES ('aiEnabled', 'false', 1);

-- OpenAI settings
INSERT INTO options (name, value, isSynced) VALUES ('openaiApiKey', '', 1);
INSERT INTO options (name, value, isSynced) VALUES ('openaiDefaultModel', 'gpt-4o', 1);
INSERT INTO options (name, value, isSynced) VALUES ('openaiBaseUrl', 'https://api.openai.com/v1', 1);

-- Anthropic settings  
INSERT INTO options (name, value, isSynced) VALUES ('anthropicApiKey', '', 1);
INSERT INTO options (name, value, isSynced) VALUES ('anthropicDefaultModel', 'claude-3-opus-20240229', 1);
INSERT INTO options (name, value, isSynced) VALUES ('anthropicBaseUrl', 'https://api.anthropic.com/v1', 1);

-- Ollama settings
INSERT INTO options (name, value, isSynced) VALUES ('ollamaEnabled', 'false', 1);
INSERT INTO options (name, value, isSynced) VALUES ('ollamaBaseUrl', 'http://localhost:11434', 1);
INSERT INTO options (name, value, isSynced) VALUES ('ollamaDefaultModel', 'llama3', 1);

-- General AI settings
INSERT INTO options (name, value, isSynced) VALUES ('aiProviderPrecedence', 'openai,anthropic,ollama', 1);
INSERT INTO options (name, value, isSynced) VALUES ('aiTemperature', '0.7', 1);
INSERT INTO options (name, value, isSynced) VALUES ('aiSystemPrompt', '', 1); 