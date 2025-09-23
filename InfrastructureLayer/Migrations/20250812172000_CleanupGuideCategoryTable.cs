using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InfrastructureLayer.Migrations
{
    /// <inheritdoc />
    public partial class CleanupGuideCategoryTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove GenreId foreign key constraint if it exists
            migrationBuilder.DropForeignKey(
                name: "FK_GuideCategories_Genres_GenreId",
                table: "GuideCategories");

            // Remove GenreId index if it exists
            migrationBuilder.DropIndex(
                name: "IX_GuideCategories_GenreId",
                table: "GuideCategories");

            // Remove GenreId column from GuideCategories table
            migrationBuilder.DropColumn(
                name: "GenreId",
                table: "GuideCategories");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add GenreId column back
            migrationBuilder.AddColumn<int>(
                name: "GenreId",
                table: "GuideCategories",
                type: "int",
                nullable: true);

            // Add index back
            migrationBuilder.CreateIndex(
                name: "IX_GuideCategories_GenreId",
                table: "GuideCategories",
                column: "GenreId");

            // Add foreign key constraint back
            migrationBuilder.AddForeignKey(
                name: "FK_GuideCategories_Genres_GenreId",
                table: "GuideCategories",
                column: "GenreId",
                principalTable: "Genres",
                principalColumn: "Id");
        }
    }
}
