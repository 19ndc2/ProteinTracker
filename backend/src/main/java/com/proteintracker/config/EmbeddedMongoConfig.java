package com.proteintracker.config;

import de.bwaldvogel.mongo.MongoServer;
import de.bwaldvogel.mongo.backend.memory.MemoryBackend;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.InetSocketAddress;
import java.util.Arrays;
import java.util.Map;

public class EmbeddedMongoConfig implements EnvironmentPostProcessor {

    private static MongoServer server;

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
        if (!Arrays.asList(env.getActiveProfiles()).contains("e2e")) {
            return;
        }
        server = new MongoServer(new MemoryBackend());
        InetSocketAddress addr = server.bind();
        String uri = "mongodb://localhost:" + addr.getPort() + "/protein_tracker_e2e";
        env.getPropertySources().addFirst(
                new MapPropertySource("embeddedMongo", Map.of("spring.data.mongodb.uri", uri)));
        Runtime.getRuntime().addShutdownHook(new Thread(() -> server.shutdown()));
    }
}
