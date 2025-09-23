using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InfrastructureLayer.Migrations
{
    /// <inheritdoc />
    public partial class UpdateGuideCategoryStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GuideCategories_Genres_GenreId",
                table: "GuideCategories");

            migrationBuilder.DropForeignKey(
                name: "FK_GuideCategories_Guides_GuideId",
                table: "GuideCategories");

            migrationBuilder.DropForeignKey(
                name: "FK_Guides_GuideCategoryEntities_GuideCategoryId",
                table: "Guides");

            migrationBuilder.DropTable(
                name: "GuideCategoryEntities");

            migrationBuilder.DropIndex(
                name: "IX_GuideCategories_GuideId_GenreId",
                table: "GuideCategories");

            migrationBuilder.DropColumn(
                name: "EstimatedTimeMinutes",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "GuideId",
                table: "GuideCategories");

            migrationBuilder.AlterColumn<int>(
                name: "GenreId",
                table: "GuideCategories",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "GuideCategories",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IconClass",
                table: "GuideCategories",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "GuideCategories",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "GuideCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.InsertData(
                table: "GuideCategories",
                columns: new[] { "Id", "CreatedDate", "Description", "GenreId", "IconClass", "Name", "Order" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Yeni başlayanlar için temel rehberler", null, "fas fa-play-circle", "Başlangıç Rehberi", 1 },
                    { 2, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Ana ve yan görevler için detaylı rehberler", null, "fas fa-tasks", "Görev Rehberleri", 2 },
                    { 3, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Zorlu boss mücadeleleri için stratejiler", null, "fas fa-dragon", "Boss Savaşları", 3 },
                    { 4, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyuncu karşı oyuncu mücadele rehberleri", null, "fas fa-sword", "PvP Rehberleri", 4 },
                    { 5, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Karakter ve ekipman build rehberleri", null, "fas fa-tools", "Build Rehberleri", 5 },
                    { 6, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Eşya, başarım ve koleksiyon rehberleri", null, "fas fa-trophy", "Koleksiyonlar", 6 },
                    { 7, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Hızlı tamamlama teknikleri", null, "fas fa-stopwatch", "Speedrun", 7 },
                    { 8, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun modifikasyonları rehberleri", null, "fas fa-wrench", "Mod Rehberleri", 8 },
                    { 9, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Performans ve ayar optimizasyonu", null, "fas fa-cog", "Optimizasyon", 9 },
                    { 10, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun içi ekonomi ve ticaret rehberleri", null, "fas fa-coins", "Ekonomi", 10 },
                    { 11, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Harita ve konum rehberleri", null, "fas fa-map", "Haritalar", 11 },
                    { 12, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Karakter seçimi ve gelişimi", null, "fas fa-user-friends", "Karakterler", 12 },
                    { 13, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Gizli içerikler ve easter egg'ler", null, "fas fa-eye", "Sırlar", 13 },
                    { 14, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Genel oyun ipuçları ve taktikler", null, "fas fa-lightbulb", "İpuçları", 14 },
                    { 15, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Diğer rehber türleri", null, "fas fa-ellipsis-h", "Diğer", 99 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_GuideCategories_Name",
                table: "GuideCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GuideCategories_Order",
                table: "GuideCategories",
                column: "Order");

            migrationBuilder.AddForeignKey(
                name: "FK_GuideCategories_Genres_GenreId",
                table: "GuideCategories",
                column: "GenreId",
                principalTable: "Genres",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Guides_GuideCategories_GuideCategoryId",
                table: "Guides",
                column: "GuideCategoryId",
                principalTable: "GuideCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GuideCategories_Genres_GenreId",
                table: "GuideCategories");

            migrationBuilder.DropForeignKey(
                name: "FK_Guides_GuideCategories_GuideCategoryId",
                table: "Guides");

            migrationBuilder.DropIndex(
                name: "IX_GuideCategories_Name",
                table: "GuideCategories");

            migrationBuilder.DropIndex(
                name: "IX_GuideCategories_Order",
                table: "GuideCategories");

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DropColumn(
                name: "Description",
                table: "GuideCategories");

            migrationBuilder.DropColumn(
                name: "IconClass",
                table: "GuideCategories");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "GuideCategories");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "GuideCategories");

            migrationBuilder.AddColumn<int>(
                name: "EstimatedTimeMinutes",
                table: "Guides",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "GenreId",
                table: "GuideCategories",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GuideId",
                table: "GuideCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "GuideCategoryEntities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IconClass = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuideCategoryEntities", x => x.Id);
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
                name: "IX_GuideCategories_GuideId_GenreId",
                table: "GuideCategories",
                columns: new[] { "GuideId", "GenreId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GuideCategoryEntities_Name",
                table: "GuideCategoryEntities",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_GuideCategories_Genres_GenreId",
                table: "GuideCategories",
                column: "GenreId",
                principalTable: "Genres",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_GuideCategories_Guides_GuideId",
                table: "GuideCategories",
                column: "GuideId",
                principalTable: "Guides",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Guides_GuideCategoryEntities_GuideCategoryId",
                table: "Guides",
                column: "GuideCategoryId",
                principalTable: "GuideCategoryEntities",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
