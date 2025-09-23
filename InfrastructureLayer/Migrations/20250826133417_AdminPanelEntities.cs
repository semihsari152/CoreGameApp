using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InfrastructureLayer.Migrations
{
    /// <inheritdoc />
    public partial class AdminPanelEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminPermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminPermissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: true),
                    EntityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OldValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Level = table.Column<int>(type: "int", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserAdminPermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    AdminPermissionId = table.Column<int>(type: "int", nullable: false),
                    GrantedByUserId = table.Column<int>(type: "int", nullable: false),
                    GrantedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RevokedByUserId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAdminPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAdminPermissions_AdminPermissions_AdminPermissionId",
                        column: x => x.AdminPermissionId,
                        principalTable: "AdminPermissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserAdminPermissions_Users_GrantedByUserId",
                        column: x => x.GrantedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserAdminPermissions_Users_RevokedByUserId",
                        column: x => x.RevokedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserAdminPermissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "AdminPermissions",
                columns: new[] { "Id", "Category", "CreatedDate", "Description", "IsActive", "Key", "Name", "Order", "UpdatedDate" },
                values: new object[,]
                {
                    { 1, "User Management", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Kullanıcıları görüntüleme, düzenleme", true, "users.manage", "Kullanıcı Yönetimi", 1, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "Content Management", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Blog ve rehberleri yönetme", true, "content.manage", "İçerik Yönetimi", 2, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "Content Management", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Forum konularını yönetme", true, "forum.manage", "Forum Yönetimi", 3, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, "Game Management", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Oyun verilerini yönetme", true, "games.manage", "Oyun Yönetimi", 4, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, "Report Management", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Raporları inceleme ve çözme", true, "reports.manage", "Rapor Yönetimi", 5, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 6, "System Management", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Sistem ayarları ve istatistikler", true, "system.manage", "Sistem Yönetimi", 6, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
                    { 7, "Admin Management", new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc), "Admin yetkilerini yönetme", true, "admin.manage", "Admin Yönetimi", 7, new DateTime(2025, 8, 10, 12, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminPermissions_Category",
                table: "AdminPermissions",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_AdminPermissions_IsActive",
                table: "AdminPermissions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AdminPermissions_Key",
                table: "AdminPermissions",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityType_EntityId",
                table: "AuditLogs",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Level",
                table: "AuditLogs",
                column: "Level");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId_Timestamp",
                table: "AuditLogs",
                columns: new[] { "UserId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_UserAdminPermissions_AdminPermissionId",
                table: "UserAdminPermissions",
                column: "AdminPermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAdminPermissions_GrantedAt",
                table: "UserAdminPermissions",
                column: "GrantedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserAdminPermissions_GrantedByUserId",
                table: "UserAdminPermissions",
                column: "GrantedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAdminPermissions_IsActive",
                table: "UserAdminPermissions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_UserAdminPermissions_RevokedByUserId",
                table: "UserAdminPermissions",
                column: "RevokedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAdminPermissions_UserId_AdminPermissionId",
                table: "UserAdminPermissions",
                columns: new[] { "UserId", "AdminPermissionId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "UserAdminPermissions");

            migrationBuilder.DropTable(
                name: "AdminPermissions");
        }
    }
}
