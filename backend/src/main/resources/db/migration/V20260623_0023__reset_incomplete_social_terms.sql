UPDATE users
SET terms_agreed_at = NULL
WHERE provider <> 'LOCAL'
  AND role IS NULL
  AND deleted_at IS NULL
  AND is_admin = FALSE
  AND is_test_account = FALSE;
