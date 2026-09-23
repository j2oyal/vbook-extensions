function execute() {
    return Response.success([
        { title: "Mới nhất", input: "/moi-nhat", script: "gen.js" },
        { title: "Xem nhiều", input: "/xem-nhieu", script: "gen.js" },
        { title: "Đề cử", input: "/de-cu", script: "gen.js" },
        { title: "Hoàn thành", input: "/hoan-thanh", script: "gen.js" }
    ]);
}
