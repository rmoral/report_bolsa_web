"""
InlineKeyboardMarkup factories for the Telegram bot.
"""
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

from social_automation.database.models import Platform


def post_approval_keyboard(post_id: int, platform: Platform) -> InlineKeyboardMarkup:
    """Approve / Reject / Edit buttons for a single post."""
    p = platform.value
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("Aprobar", callback_data=f"approve:{post_id}"),
            InlineKeyboardButton("Rechazar", callback_data=f"reject:{post_id}"),
        ],
        [
            InlineKeyboardButton("Editar contenido", callback_data=f"edit:{post_id}"),
        ],
    ])


def confirm_edit_keyboard(post_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("Guardar y aprobar", callback_data=f"confirm_edit:{post_id}"),
            InlineKeyboardButton("Cancelar", callback_data=f"cancel_edit:{post_id}"),
        ]
    ])


def pagination_keyboard(page: int, total_pages: int, prefix: str) -> InlineKeyboardMarkup:
    buttons = []
    row = []
    if page > 0:
        row.append(InlineKeyboardButton("← Anterior", callback_data=f"{prefix}:page:{page - 1}"))
    if page < total_pages - 1:
        row.append(InlineKeyboardButton("Siguiente →", callback_data=f"{prefix}:page:{page + 1}"))
    if row:
        buttons.append(row)
    return InlineKeyboardMarkup(buttons)


def pending_header_keyboard() -> InlineKeyboardMarkup:
    """Header keyboard shown with the pending posts count message."""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("Descartar todos", callback_data="discard_all_pending")],
    ])


def platform_filter_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("LinkedIn", callback_data="filter:linkedin"),
            InlineKeyboardButton("X / Twitter", callback_data="filter:twitter"),
            InlineKeyboardButton("Instagram", callback_data="filter:instagram"),
        ],
        [InlineKeyboardButton("Todas las plataformas", callback_data="filter:all")],
    ])


PLATFORM_EMOJIS = {
    "twitter": "𝕏",
    "linkedin": "🔵",
    "instagram": "📸",
}


def account_selection_keyboard(accounts: list, post_id: int) -> InlineKeyboardMarkup:
    """One button per Twitter account plus a Cancel button."""
    rows = []
    for account in accounts:
        rows.append([
            InlineKeyboardButton(
                account.name,
                callback_data=f"account_select:{post_id}:{account.id}",
            )
        ])
    rows.append([
        InlineKeyboardButton(
            "Cancelar",
            callback_data=f"account_select:{post_id}:cancel",
        )
    ])
    return InlineKeyboardMarkup(rows)
