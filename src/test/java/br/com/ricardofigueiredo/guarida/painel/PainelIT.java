package br.com.ricardofigueiredo.guarida.painel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PainelIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("abrigo sem nenhum animal recebe resumo zerado, e nao erro")
    void resumoVazio() throws Exception {
        String token = autenticar();

        mockMvc.perform(get("/api/v1/painel/resumo").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.disponiveis").value(0))
                .andExpect(jsonPath("$.mediaDeDiasAteAdocao").value(0.0));
    }

    @Test
    @DisplayName("o resumo conta por situacao e soma no banco")
    void resumoContaPorSituacao() throws Exception {
        String token = autenticar();
        criarAnimal(token, "Bidu", "CACHORRO");
        long amora = criarAnimal(token, "Amora", "GATO");
        long tobias = criarAnimal(token, "Tobias", "CACHORRO");

        mockMvc.perform(post("/api/v1/animais/" + tobias + "/suspensao")
                .header(HttpHeaders.AUTHORIZATION, token));

        long candidatura = candidatar(amora);
        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/aprovacao")
                .header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(get("/api/v1/painel/resumo").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.disponiveis").value(1))
                .andExpect(jsonPath("$.emProcesso").value(1))
                .andExpect(jsonPath("$.indisponiveis").value(1))
                .andExpect(jsonPath("$.adotados").value(0));
    }

    @Test
    @DisplayName("a fila em aberto entra no resumo")
    void resumoContaAFila() throws Exception {
        String token = autenticar();
        long bidu = criarAnimal(token, "Bidu", "CACHORRO");
        candidatar(bidu);
        candidatar(bidu);

        mockMvc.perform(get("/api/v1/painel/resumo").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.candidaturasEmAberto").value(2));
    }

    @Test
    @DisplayName("a contagem por especie sai ordenada da maior para a menor")
    void contagemPorEspecie() throws Exception {
        String token = autenticar();
        criarAnimal(token, "Bidu", "CACHORRO");
        criarAnimal(token, "Tobias", "CACHORRO");
        criarAnimal(token, "Amora", "GATO");

        mockMvc.perform(get("/api/v1/painel/especies").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].especie").value("CACHORRO"))
                .andExpect(jsonPath("$[0].quantidade").value(2))
                .andExpect(jsonPath("$[0].rotulo").value("Cachorro"));
    }

    @Test
    @DisplayName("adocao concluida aparece na contagem mensal e no tempo medio")
    void adocoesPorMes() throws Exception {
        String token = autenticar();
        long bidu = criarAnimal(token, "Bidu", "CACHORRO");
        long candidatura = candidatar(bidu);

        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/aprovacao")
                .header(HttpHeaders.AUTHORIZATION, token));
        mockMvc.perform(post("/api/v1/candidaturas/" + candidatura + "/adocao")
                .header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(get("/api/v1/painel/adocoes-por-mes").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].quantidade").value(1));

        mockMvc.perform(get("/api/v1/painel/resumo").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.adotados").value(1))
                .andExpect(jsonPath("$.mediaDeDiasAteAdocao").value(
                        org.hamcrest.Matchers.greaterThan(0.0)));
    }

    @Test
    @DisplayName("o painel mostra tambem os animais fora da vitrine, o catalogo nao")
    void painelMostraOsSuspensos() throws Exception {
        String token = autenticar();
        long tobias = criarAnimal(token, "Tobias", "CACHORRO");

        mockMvc.perform(post("/api/v1/animais/" + tobias + "/suspensao")
                .header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(get("/api/v1/painel/animais").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(jsonPath("$.totalDeItens").value(1));

        mockMvc.perform(get("/api/v1/animais").param("status", "DISPONIVEL"))
                .andExpect(jsonPath("$.totalDeItens").value(0));
    }

    @Test
    @DisplayName("o painel de um abrigo nao mostra o acervo de outro")
    void painelIsolaPorAbrigo() throws Exception {
        String tokenA = autenticar();
        criarAnimal(tokenA, "Bidu", "CACHORRO");

        String tokenB = autenticar();

        mockMvc.perform(get("/api/v1/painel/animais").header(HttpHeaders.AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.totalDeItens").value(0));

        mockMvc.perform(get("/api/v1/painel/resumo").header(HttpHeaders.AUTHORIZATION, tokenB))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    @DisplayName("o painel inteiro exige token")
    void painelExigeToken() throws Exception {
        mockMvc.perform(get("/api/v1/painel/resumo")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/painel/animais")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/painel/especies")).andExpect(status().isUnauthorized());
    }

    private long candidatar(long animal) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/v1/animais/" + animal + "/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "Maria Souza", "email": "maria-%s@exemplo.com",
                                 "telefone": "21999998888", "cidade": "Niteroi", "moradia": "CASA",
                                 "areaProtegida": true, "temOutrosAnimais": false}"""
                                .formatted(UUID.randomUUID())))
                .andExpect(status().isCreated())
                .andReturn();

        return ler(resultado).get("id").asLong();
    }

    private long criarAnimal(String token, String nome, String especie) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "%s",
                                  "especie": "%s",
                                  "sexo": "MACHO",
                                  "porte": "MEDIO",
                                  "nascimentoEstimado": "%s",
                                  "pesoEmGramas": 12000,
                                  "dataDeEntrada": "%s"
                                }""".formatted(nome, especie, LocalDate.now().minusYears(2),
                                LocalDate.now().minusMonths(4))))
                .andExpect(status().isCreated())
                .andReturn();

        return ler(resultado).get("id").asLong();
    }

    private String autenticar() throws Exception {
        String email = "abrigo-" + UUID.randomUUID() + "@exemplo.com";

        mockMvc.perform(post("/api/v1/autenticacao/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nome": "Abrigo", "email": "%s", "senha": "senhaforte123",
                         "cidade": "Niteroi"}""".formatted(email)));

        MvcResult login = mockMvc.perform(post("/api/v1/autenticacao/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "senha": "senhaforte123"}""".formatted(email))).andReturn();

        return "Bearer " + ler(login).get("token").asText();
    }

    private JsonNode ler(MvcResult resultado) throws Exception {
        return objectMapper.readTree(resultado.getResponse().getContentAsString());
    }
}
