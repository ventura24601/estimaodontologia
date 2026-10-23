# Estima Odontologia — site

Site estático (HTML, CSS e JS puros, sem build). Basta publicar a pasta em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, hospedagem comum).

```
index.html
assets/css/style.css
assets/js/main.js
assets/img/            logo, favicon e fotos da clínica
```

## Antes de publicar

1. **Formulário → e-mail.** O formulário envia para `estimaodonto20@gmail.com` via [FormSubmit](https://formsubmit.co).
   No **primeiro envio** chega um e-mail de ativação nesse endereço; é preciso clicar em "Activate".
   Depois da ativação, dá para trocar o e-mail no código pelo código aleatório que o FormSubmit fornece (evita expor o e-mail).
   O endereço fica em `CONFIG.formEndpoint`, em `assets/js/main.js`.
   Se o envio falhar, o visitante recebe um link para concluir o pedido pelo WhatsApp.
2. **Redes sociais.** Os links de Facebook e Instagram ainda apontam para `facebook.com/dentistafernandoestima` e
   `instagram.com/dentistafernandoestima`. Se a página do Facebook mudou, troque em `index.html` (busque por `facebook.com`).
3. **Antes e depois.** O comparador usa ilustrações. Para usar casos reais (somente com autorização por escrito do paciente,
   conforme a Resolução CFO 196/2019), preencha `before` e `after` de cada caso em `CASES`, em `assets/js/main.js`.
4. **Fotos.** As fotos atuais vieram do site antigo (800px). Fotos novas em alta resolução valorizam bastante o hero e a galeria.

## Contatos usados no site

- WhatsApp: (53) 99700-6047
- Fixo: (53) 3224-6047
- Av. Dom Joaquim, 1515, sala 309, Pelotas/RS, CEP 96020-260
- Responsável técnico: Dr. Fernando Julio Estima, CRO-RS 23.475
