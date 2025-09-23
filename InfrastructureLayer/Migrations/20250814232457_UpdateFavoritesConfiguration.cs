using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InfrastructureLayer.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFavoritesConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Favorites_Users_UserId",
                table: "Favorites");

            migrationBuilder.DropIndex(
                name: "IX_Favorites_UserId",
                table: "Favorites");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_CreatedDate",
                table: "Favorites",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_FavoriteType_TargetEntityId",
                table: "Favorites",
                columns: new[] { "FavoriteType", "TargetEntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_UserId_FavoriteType_TargetEntityId",
                table: "Favorites",
                columns: new[] { "UserId", "FavoriteType", "TargetEntityId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Favorites_Users_UserId",
                table: "Favorites",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Favorites_Users_UserId",
                table: "Favorites");

            migrationBuilder.DropIndex(
                name: "IX_Favorites_CreatedDate",
                table: "Favorites");

            migrationBuilder.DropIndex(
                name: "IX_Favorites_FavoriteType_TargetEntityId",
                table: "Favorites");

            migrationBuilder.DropIndex(
                name: "IX_Favorites_UserId_FavoriteType_TargetEntityId",
                table: "Favorites");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_UserId",
                table: "Favorites",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Favorites_Users_UserId",
                table: "Favorites",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
