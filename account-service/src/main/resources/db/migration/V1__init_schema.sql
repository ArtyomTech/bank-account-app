CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency   VARCHAR(10)    NOT NULL,
    balance    DECIMAL(19, 4) NOT NULL DEFAULT 0,
    version    BIGINT         NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

CREATE TABLE transactions (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID           NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type          VARCHAR(30)    NOT NULL,
    amount        DECIMAL(19, 4) NOT NULL,
    currency      VARCHAR(10)    NOT NULL,
    balance_after DECIMAL(19, 4) NOT NULL,
    description   VARCHAR(500),
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_account_id_created_at
    ON transactions(account_id, created_at DESC);
