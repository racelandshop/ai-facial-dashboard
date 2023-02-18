from setuptools import setup, find_packages

setup(
    name="ai-dashboard",
    version="main",
    description="The AI dashboard frontend",
    url="https://github.com/racelandshop/ai-facial-dashboard",
    author="Rogério Ribeiro",
    author_email="rogerio.e.ramos.ribeiro@gmail.com",
    packages=find_packages(include=["ai_facial_recognition", "ai_facial_recognition.*"]),
    include_package_data=True,
    zip_safe=False,
)