using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InfrastructureLayer.Migrations
{
    /// <inheritdoc />
    public partial class UpdateGuideSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "EstimatedTimeMinutes",
                table: "Guides",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Difficulty",
                table: "Guides",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GuideCategoryId",
                table: "Guides",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GuideCategoryEntities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IconClass = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuideCategoryEntities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GuideTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GuideId = table.Column<int>(type: "int", nullable: false),
                    TagId = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuideTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuideTags_Guides_GuideId",
                        column: x => x.GuideId,
                        principalTable: "Guides",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GuideTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "GuideCategoryEntities",
                columns: new[] { "Id", "CreatedDate", "Description", "IconClass", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Yeni başlayanlar için temel rehberler", "fas fa-play-circle", "Başlangıç Rehberi" },
                    { 2, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Ana ve yan görevler için detaylı rehberler", "fas fa-tasks", "Görev Rehberleri" },
                    { 3, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Zorlu boss mücadeleleri için stratejiler", "fas fa-dragon", "Boss Savaşları" },
                    { 4, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyuncu karşı oyuncu mücadele rehberleri", "fas fa-sword", "PvP Rehberleri" },
                    { 5, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Karakter ve ekipman build rehberleri", "fas fa-tools", "Build Rehberleri" },
                    { 6, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Eşya, başarım ve koleksiyon rehberleri", "fas fa-trophy", "Koleksiyonlar" },
                    { 7, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Hızlı tamamlama teknikleri", "fas fa-stopwatch", "Speedrun" },
                    { 8, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun modifikasyonları rehberleri", "fas fa-wrench", "Mod Rehberleri" },
                    { 9, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Performans ve ayar optimizasyonu", "fas fa-cog", "Optimizasyon" },
                    { 10, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun içi ekonomi ve ticaret rehberleri", "fas fa-coins", "Ekonomi" },
                    { 11, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Harita ve konum rehberleri", "fas fa-map", "Haritalar" },
                    { 12, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Karakter seçimi ve gelişimi", "fas fa-user-friends", "Karakterler" },
                    { 13, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Gizli içerikler ve easter egg'ler", "fas fa-eye", "Sırlar" },
                    { 14, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Genel oyun ipuçları ve taktikler", "fas fa-lightbulb", "İpuçları" },
                    { 15, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Diğer rehber türleri", "fas fa-ellipsis-h", "Diğer" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Guides_GuideCategoryId",
                table: "Guides",
                column: "GuideCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_GuideCategoryEntities_Name",
                table: "GuideCategoryEntities",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GuideTags_GuideId_TagId",
                table: "GuideTags",
                columns: new[] { "GuideId", "TagId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GuideTags_TagId",
                table: "GuideTags",
                column: "TagId");

            migrationBuilder.AddForeignKey(
                name: "FK_Guides_GuideCategoryEntities_GuideCategoryId",
                table: "Guides",
                column: "GuideCategoryId",
                principalTable: "GuideCategoryEntities",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Guides_GuideCategoryEntities_GuideCategoryId",
                table: "Guides");

            migrationBuilder.DropTable(
                name: "GuideCategoryEntities");

            migrationBuilder.DropTable(
                name: "GuideTags");

            migrationBuilder.DropIndex(
                name: "IX_Guides_GuideCategoryId",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "GuideCategoryId",
                table: "Guides");

            migrationBuilder.AlterColumn<int>(
                name: "EstimatedTimeMinutes",
                table: "Guides",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Difficulty",
                table: "Guides",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);
        }
    }
}
