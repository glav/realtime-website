"""
Acceptance tests for the realtime-website Python application.
Tests verify core functionality works as expected from a user perspective.
"""
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


def test_load_env_function_exists():
    """Acceptance: User can import and call load_env function."""
    from load_env import load_env
    
    assert callable(load_env), "load_env should be a callable function"


def test_load_env_returns_boolean():
    """Acceptance: load_env function returns a boolean status."""
    from load_env import load_env
    
    result = load_env()
    assert isinstance(result, bool), f"load_env should return bool, got {type(result)}"


def test_app_main_function_exists():
    """Acceptance: User can import app.main function."""
    from app import main
    
    assert callable(main), "main should be a callable function"


def test_app_main_executes_without_error():
    """Acceptance: Running app.main() completes successfully."""
    from app import main
    
    # Should execute without raising an exception
    try:
        main()
    except Exception as e:
        assert False, f"main() should execute without error, got: {e}"


def test_load_env_function_uses_dotenv():
    """Acceptance: load_env properly uses python-dotenv library."""
    from load_env import load_env
    import inspect
    
    source = inspect.getsource(load_env)
    assert "load_dotenv" in source, "load_env should use load_dotenv from python-dotenv"


def test_app_imports_load_env():
    """Acceptance: app.py properly imports and uses load_env."""
    from app import main
    import inspect
    
    source = inspect.getsource(main)
    assert "load_env" in source, "main() should call load_env()"
