package br.com.ricardofigueiredo.guarida.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * O relogio e injetado em vez de chamado direto para que o teste possa fixar
 * uma data e conferir regras que dependem de idade sem depender do dia em que
 * a suite roda.
 */
@Configuration
public class RelogioConfig {

    @Bean
    public Clock relogio() {
        return Clock.systemDefaultZone();
    }
}
