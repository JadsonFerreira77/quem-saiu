# Quem Saiu?

Site: https://quemsaiu.vercel.app

Ferramenta web gratuita para descobrir, no Instagram:

- quem você segue e **não te segue de volta**;
- quem te segue e **você não segue de volta**;
- quem **deixou de te seguir** (comparando um export antigo com um novo);
- **novos seguidores**.

Sem senha e sem login: o site lê o arquivo oficial de dados que o próprio Instagram exporta, e tudo é processado **no seu navegador**. Nenhum dado é enviado para servidor.

## Como usar

1. No Instagram: perfil > ☰ > **Central de Contas** > **Suas informações e permissões** > **Baixar suas informações**.
2. **Baixar ou transferir informações** > sua conta > **Algumas das suas informações** > marque **Seguidores e seguindo**.
3. **Baixar no dispositivo**, intervalo **Desde o início**, formato **JSON** (não HTML) > **Criar arquivos**.
4. Quando o e-mail chegar, baixe o `.zip` e envie no site.
5. Para ver quem deixou de seguir, guarde o `.zip` e, da próxima vez, envie o antigo e o novo juntos.

## Por que não é um app com login?

A API oficial do Instagram não permite que apps de terceiros leiam a lista de seguidores nem deixem de seguir pessoas. Apps que pedem a sua senha violam as regras da Meta e podem fazer a conta ser bloqueada. Por isso o "deixar de seguir" é feito por você: cada perfil tem um botão **Abrir perfil** e um modo **Abrir próximo** para ir um por um.

> O Instagram limita quantas pessoas você pode deixar de seguir por hora. Vá com calma (algo como 100–150 por dia).

## Tecnologia

- Um único `index.html`, HTML + CSS + JavaScript puro, sem dependências.
- Leitor de ZIP próprio usando `DecompressionStream('deflate-raw')` nativo do navegador.
- Lê `followers_N.json` e `following.json` (pasta `connections/followers_and_following/`).
- Hospedado na Vercel como site estático.

## Rodar localmente

Abra o `index.html` no navegador. Só isso.

---

Não é afiliado ao Instagram nem à Meta.
