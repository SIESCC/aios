import os
import psycopg2
import uuid
import logging
import json

logger = logging.getLogger("seeder")

def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return psycopg2.connect(db_url)
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "aios_db"),
        user=os.getenv("DB_USER", "aios"),
        password=os.getenv("DB_PASSWORD", "aios_secret_change_me")
    )

def run_seed():
    """Populates necessary baseline data for new platform features (Workflows, Ecosystem, etc.)"""
    logger.info("▶ Checking if baseline data needs to be seeded...")
    try:
        conn = get_db_connection()
        conn.autocommit = False
        
        # Seed Workflows
        with conn.cursor() as cur:
            cur.execute('SELECT count(*) FROM workflows')
            if cur.fetchone()[0] == 0:
                logger.info("Seeding Workflows...")
                workflows = [
                    {
                        "title": "Content Creation Pipeline",
                        "slug": "content-creation-pipeline",
                        "description": "Full content creation from idea to published video",
                        "category": "Content Creation",
                        "featured": True,
                        "steps": [
                            {"stepOrder": 1, "toolName": "ChatGPT", "toolSlug": "chatgpt", "action": "Idea Generation", "description": "Generate content ideas"},
                            {"stepOrder": 2, "toolName": "Claude", "action": "Script Writing", "description": "Write detailed scripts"},
                        ]
                    },
                    {
                        "title": "Coding Assistant Pipeline",
                        "slug": "coding-assistant-pipeline",
                        "description": "Accelerated development with AI tools",
                        "category": "Coding",
                        "featured": True,
                        "steps": [
                            {"stepOrder": 1, "toolName": "ChatGPT", "toolSlug": "chatgpt", "action": "Architecture Design", "description": "Plan system architecture"},
                            {"stepOrder": 2, "toolName": "Cursor", "action": "Code Implementation", "description": "Write code with AI assistance"},
                        ]
                    }
                ]
                
                for wf in workflows:
                    wf_id = uuid.uuid4().hex
                    cur.execute("""
                        INSERT INTO workflows (id, title, slug, description, category, "isPublic", featured, "usageCount", "createdAt", "updatedAt")
                        VALUES (%s, %s, %s, %s, %s, true, %s, 0, NOW(), NOW())
                    """, (wf_id, wf["title"], wf["slug"], wf["description"], wf["category"], wf["featured"]))
                    
                    for step in wf["steps"]:
                        cur.execute("""
                            INSERT INTO workflow_steps (id, "workflowId", "stepOrder", "toolName", "toolSlug", action, description)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (uuid.uuid4().hex, wf_id, step["stepOrder"], step["toolName"], step.get("toolSlug"), step["action"], step["description"]))
                
        # Seed Ecosystem Relations
        with conn.cursor() as cur:
            cur.execute('SELECT count(*) FROM ecosystem_relations')
            if cur.fetchone()[0] == 0:
                logger.info("Seeding Ecosystem Relations...")
                
                # Fetch a tool and a model to link if possible, or use hardcoded names
                cur.execute('SELECT id, name FROM ai_tools LIMIT 2')
                tools = cur.fetchall()
                if len(tools) > 0:
                    relations = [
                        ("startup", "start_1", "Anthropic", "tool", tools[0][0], tools[0][1], "owns", 1.0),
                        ("tool", tools[0][0], tools[0][1], "model", "mod_1", "GPT-4o", "uses", 0.95)
                    ]
                    for rel in relations:
                        cur.execute("""
                            INSERT INTO ecosystem_relations (id, "sourceType", "sourceId", "sourceName", "targetType", "targetId", "targetName", "relationshipType", strength, "createdAt")
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                            ON CONFLICT DO NOTHING
                        """, (uuid.uuid4().hex, rel[0], rel[1], rel[2], rel[3], rel[4], rel[5], rel[6], rel[7]))
                        
        conn.commit()
        logger.info("✅ Baseline data check complete.")
    except Exception as e:
        logger.error(f"❌ Seeding error: {e}")
        try:
            conn.rollback()
        except:
            pass
    finally:
        try:
            conn.close()
        except:
            pass

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_seed()
