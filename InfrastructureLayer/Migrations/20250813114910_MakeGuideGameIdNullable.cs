using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InfrastructureLayer.Migrations
{
    /// <inheritdoc />
    public partial class MakeGuideGameIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Check if columns exist before trying to drop constraints
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_GuideCategories_Genres_GenreId')
                    ALTER TABLE [GuideCategories] DROP CONSTRAINT [FK_GuideCategories_Genres_GenreId];
                
                IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Guides_Users_UserId1')
                    ALTER TABLE [Guides] DROP CONSTRAINT [FK_Guides_Users_UserId1];
                
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Guides_UserId1')
                    DROP INDEX [IX_Guides_UserId1] ON [Guides];
                
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GuideCategories_GenreId')
                    DROP INDEX [IX_GuideCategories_GenreId] ON [GuideCategories];
                
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Guides') AND name = 'UserId1')
                    ALTER TABLE [Guides] DROP COLUMN [UserId1];
                
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GuideCategories') AND name = 'GenreId')
                    ALTER TABLE [GuideCategories] DROP COLUMN [GenreId];
            ");

            migrationBuilder.DropForeignKey(
                name: "FK_Guides_Games_GameId",
                table: "Guides");

            migrationBuilder.AlterColumn<int>(
                name: "GameId",
                table: "Guides",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Guides_Games_GameId",
                table: "Guides",
                column: "GameId",
                principalTable: "Games",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Guides_Games_GameId",
                table: "Guides");

            migrationBuilder.AlterColumn<int>(
                name: "GameId",
                table: "Guides",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId1",
                table: "Guides",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GenreId",
                table: "GuideCategories",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 1,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 2,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 3,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 4,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 5,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 6,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 7,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 8,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 9,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 10,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 11,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 12,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 13,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 14,
                column: "GenreId",
                value: null);

            migrationBuilder.UpdateData(
                table: "GuideCategories",
                keyColumn: "Id",
                keyValue: 15,
                column: "GenreId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Guides_UserId1",
                table: "Guides",
                column: "UserId1");

            migrationBuilder.CreateIndex(
                name: "IX_GuideCategories_GenreId",
                table: "GuideCategories",
                column: "GenreId");

            migrationBuilder.AddForeignKey(
                name: "FK_GuideCategories_Genres_GenreId",
                table: "GuideCategories",
                column: "GenreId",
                principalTable: "Genres",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Guides_Games_GameId",
                table: "Guides",
                column: "GameId",
                principalTable: "Games",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Guides_Users_UserId1",
                table: "Guides",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
