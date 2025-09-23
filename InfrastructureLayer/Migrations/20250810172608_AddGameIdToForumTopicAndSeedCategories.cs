using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InfrastructureLayer.Migrations
{
    /// <inheritdoc />
    public partial class AddGameIdToForumTopicAndSeedCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Content",
                table: "Guides");

            migrationBuilder.AlterColumn<string>(
                name: "Summary",
                table: "Guides",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Difficulty",
                table: "Guides",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedTimeMinutes",
                table: "Guides",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Guides",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TableOfContents",
                table: "Guides",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailUrl",
                table: "Guides",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId1",
                table: "Guides",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GameId",
                table: "ForumTopics",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GuideBlocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GuideId = table.Column<int>(type: "int", nullable: false),
                    BlockType = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MediaUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Caption = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Metadata = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuideBlocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuideBlocks_Guides_GuideId",
                        column: x => x.GuideId,
                        principalTable: "Guides",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ForumCategories",
                columns: new[] { "Id", "CreatedDate", "Description", "Name", "Order" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1298), "Genel oyun tartışmaları", "Genel Tartışma", 0 },
                    { 2, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1394), "Oyun yardımları ve teknik destek", "Yardım & Destek", 0 },
                    { 3, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1395), "Oyun inceleme ve değerlendirmeleri", "Oyun İncelemeleri", 0 },
                    { 4, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1396), "Oyun dünyasından haberler", "Haberler", 0 },
                    { 5, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1397), "Oyun rehberleri ve ipuçları", "Rehberler & İpuçları", 0 },
                    { 6, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1398), "Multiplayer oyun tartışmaları", "Çok Oyunculu", 0 },
                    { 7, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1398), "E-spor ve turnuva tartışmaları", "E-Spor", 0 },
                    { 8, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1399), "Oyun indirim ve kampanyaları", "İndirimler", 0 },
                    { 9, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1400), "Oyun modları ve özelleştirmeler", "Mod & Özelleştirme", 0 },
                    { 10, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1401), "PC oyun donanımı ve optimizasyon", "PC Gaming", 0 },
                    { 11, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1402), "Konsol oyun tartışmaları", "Konsol Gaming", 0 },
                    { 12, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1403), "Mobil oyun tartışmaları", "Mobile Gaming", 0 },
                    { 13, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1403), "Eski ve klasik oyunlar", "Retro Gaming", 0 },
                    { 14, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1404), "Bağımsız oyun geliştiricileri", "Indie Oyunlar", 0 },
                    { 15, new DateTime(2025, 8, 10, 17, 26, 8, 366, DateTimeKind.Utc).AddTicks(1405), "Diğer konular", "Diğer", 0 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Guides_CreatedDate",
                table: "Guides",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_Guides_IsFeatured",
                table: "Guides",
                column: "IsFeatured");

            migrationBuilder.CreateIndex(
                name: "IX_Guides_IsPublished",
                table: "Guides",
                column: "IsPublished");

            migrationBuilder.CreateIndex(
                name: "IX_Guides_UserId1",
                table: "Guides",
                column: "UserId1");

            migrationBuilder.CreateIndex(
                name: "IX_ForumTopics_GameId",
                table: "ForumTopics",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_GuideBlocks_GuideId_Order",
                table: "GuideBlocks",
                columns: new[] { "GuideId", "Order" });

            migrationBuilder.AddForeignKey(
                name: "FK_ForumTopics_Games_GameId",
                table: "ForumTopics",
                column: "GameId",
                principalTable: "Games",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Guides_Users_UserId1",
                table: "Guides",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ForumTopics_Games_GameId",
                table: "ForumTopics");

            migrationBuilder.DropForeignKey(
                name: "FK_Guides_Users_UserId1",
                table: "Guides");

            migrationBuilder.DropTable(
                name: "GuideBlocks");

            migrationBuilder.DropIndex(
                name: "IX_Guides_CreatedDate",
                table: "Guides");

            migrationBuilder.DropIndex(
                name: "IX_Guides_IsFeatured",
                table: "Guides");

            migrationBuilder.DropIndex(
                name: "IX_Guides_IsPublished",
                table: "Guides");

            migrationBuilder.DropIndex(
                name: "IX_Guides_UserId1",
                table: "Guides");

            migrationBuilder.DropIndex(
                name: "IX_ForumTopics_GameId",
                table: "ForumTopics");

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "ForumCategories",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "EstimatedTimeMinutes",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "TableOfContents",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "ThumbnailUrl",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "GameId",
                table: "ForumTopics");

            migrationBuilder.AlterColumn<string>(
                name: "Summary",
                table: "Guides",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Guides",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
