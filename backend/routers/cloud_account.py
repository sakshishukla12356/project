from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.base import get_db
from models.cloud_account import CloudAccount

router = APIRouter()


# ─────────────────────────────────────────────
# 🔹 ADD CLOUD ACCOUNT
# ─────────────────────────────────────────────
@router.post("/add")
def add_cloud_account(data: dict, db: Session = Depends(get_db)):

    try:
        account = CloudAccount(**data)

        db.add(account)
        db.commit()
        db.refresh(account)

        return {
            "status": "success",
            "message": "Cloud account added successfully",
            "account_id": account.id
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


# ─────────────────────────────────────────────
# 🔹 GET USER CLOUD ACCOUNTS
# ─────────────────────────────────────────────
@router.get("/list/{user_id}")
def get_accounts(user_id: int, db: Session = Depends(get_db)):

    accounts = db.query(CloudAccount).filter(
        CloudAccount.user_id == user_id
    ).all()

    return accounts