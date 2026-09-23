load('config.js');

function execute() {
    return Response.success([
        { title: "Mới nhất", input: BASE_URL + "/moi-nhat", script: "gen.js" },
        { title: "Xem nhiều", input: BASE_URL + "/xem-nhieu", script: "gen.js" },
        { title: "Hoàn thành", input: BASE_URL + "/hoan-thanh", script: "gen.js" }
    ]);
}
