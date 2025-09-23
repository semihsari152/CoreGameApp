using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InfrastructureLayer.Migrations
{
    /// <inheritdoc />
    public partial class SeedBlogCategoriesFixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "BlogCategories",
                columns: new[] { "Id", "Color", "CreatedDate", "Description", "Name", "Order", "UpdatedDate" },
                values: new object[,]
                {
                    { 1, "#3B82F6", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun incelemeleri ve değerlendirmeler", "İncelemeler", 1, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "#EF4444", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun dünyasından son haberler", "Haberler", 2, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "#10B981", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun rehberleri ve ipuçları", "Rehberler", 3, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, "#8B5CF6", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Gaming teknolojileri ve donanım", "Teknoloji", 4, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, "#F59E0B", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "E-spor haberleri ve analizler", "E-Spor", 5, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 6, "#6366F1", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun endüstrisi analiz ve yorumlar", "Endüstri", 6, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 7, "#84CC16", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Eski oyunlar ve nostalji", "Retrospektif", 7, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 8, "#06B6D4", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Kişisel oyun deneyimleri", "Kişisel Deneyim", 8, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 9, "#EC4899", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyuncu toplulukları ve etkinlikler", "Topluluk", 9, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 10, "#6B7280", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Genel oyun konuları", "Diğer", 10, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "BlogCategories",
                keyColumn: "Id",
                keyValue: 10);
        }
    }
}
