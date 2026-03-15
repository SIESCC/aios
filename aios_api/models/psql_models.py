from sqlalchemy import Column, String, Float, DateTime, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from core.database import Base
from datetime import datetime

class AiModelDB(Base):
    __tablename__ = "ai_models"
    
    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    organization = Column(String)
    modelType = Column(String)
    description = Column(Text)
    releaseDate = Column(DateTime)
    apiAvailable = Column(Boolean, default=False)
    openSource = Column(Boolean, default=False)
    parameterCount = Column(String)
    contextWindow = Column(Integer)
    benchmarks = Column(JSONB)
    capabilities = Column(ARRAY(String))
    trendingScore = Column(Float, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = Column(ARRAY(String))
    website = Column(String)

class AiToolDB(Base):
    __tablename__ = "ai_tools"
    
    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    pricing = Column(String)
    trendingScore = Column(Float, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = Column(ARRAY(String))
    website = Column(String)

class ResearchPaperDB(Base):
    __tablename__ = "research_papers"
    
    id = Column(String, primary_key=True)
    arxivId = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    authors = Column(ARRAY(String))
    abstract = Column(Text)
    category = Column(String)
    citationCount = Column(Integer, default=0)
    trendingScore = Column(Float, default=0)
    publicationDate = Column(DateTime)
    link = Column(String)
    pdfLink = Column(String)

class AiStartupDB(Base):
    __tablename__ = "ai_startups"
    
    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    fundingTotal = Column(String)
    valuation = Column(String)
    trendingScore = Column(Float, default=0)
    website = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)

class GitHubRepoDB(Base):
    __tablename__ = "github_repos"
    
    id = Column(String, primary_key=True)
    repoId = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    stars = Column(Integer, default=0)
    language = Column(String)
    trendingScore = Column(Float, default=0)
    url = Column(String)
    updatedAt = Column(DateTime, default=datetime.utcnow)
